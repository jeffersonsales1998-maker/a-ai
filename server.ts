import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { allProducts, allExtraOptions } from './src/data/products';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory store for orders and payment status
export interface OrderRecord {
  id: string; // unique internal orderId
  externalId: string;
  buckpayTransactionId?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  amountCents: number;
  totalAmount: number;
  pixCode: string;
  qrCodeBase64?: string;
  createdAt: string;
  paidAt?: string;
  buyer: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
  address?: any;
  items: any[];
}

const orders = new Map<string, OrderRecord>();

// Helper to generate standard BRCode Pix payload as fallback
function generateBRCode(key: string, name: string, city: string, amount: number, txId: string): string {
  const f = (id: string, val: string) => `${id}${String(val.length).padStart(2, '0')}${val}`;
  const amountStr = amount.toFixed(2);
  const merchantAccountInfo = f('00', 'br.gov.bcb.pix') + f('01', key);
  const additionalData = f('05', txId);

  let payload =
    f('00', '01') +
    f('26', merchantAccountInfo) +
    f('52', '0400') +
    f('53', '986') +
    f('54', amountStr) +
    f('58', 'BR') +
    f('59', name.substring(0, 25).toUpperCase()) +
    f('60', city.substring(0, 15).toUpperCase()) +
    f('62', additionalData) +
    '6304';

  // CRC16-CCITT
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, '0');
}

// =========================================================================
function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i), 10) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i), 10) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(clean.charAt(10), 10);
}

// ROTA: Criar transação PIX com a BuckPay (POST /api/pix/create)
// =========================================================================
app.post('/api/pix/create', async (req: Request, res: Response) => {
  try {
    const { items, deliveryType, buyer, address } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Nenhum item informado para o pedido.' });
    }

    // 1. Recalcular e validar valor REAL no servidor (nunca confiar no frontend)
    let serverSubtotal = 0;
    const verifiedItems: any[] = [];

    for (const item of items) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Produto inválido: ${item.productId}` });
      }

      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      let extrasPrice = 0;
      const verifiedExtras: any[] = [];

      if (Array.isArray(item.extras)) {
        for (const ex of item.extras) {
          const found = allExtraOptions.find((e) => e.id === ex.id);
          if (found) {
            extrasPrice += found.price;
            verifiedExtras.push({ id: found.id, name: found.name, price: found.price });
          }
        }
      }

      const itemTotal = (product.price + extrasPrice) * quantity;
      serverSubtotal += itemTotal;
      verifiedItems.push({
        productId: product.id,
        title: product.title,
        unitPrice: product.price,
        extras: verifiedExtras,
        quantity,
        itemTotal,
      });
    }

    const deliveryFee = deliveryType === 'express' ? 6.9 : 0.0;
    const serverTotal = Number((serverSubtotal + deliveryFee).toFixed(2));
    const totalAmountCents = Math.round(serverTotal * 100);

    // 2. Gerar identificador único do pedido
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 3. Formatar dados do comprador
    const rawPhone = String(buyer?.phone || '').replace(/\D/g, '');
    const phoneFormatted = rawPhone.length >= 10 ? `55${rawPhone.slice(-11)}` : '5511999999999';
    const rawCpf = String(buyer?.document || '').replace(/\D/g, '');
    const buyerName = String(buyer?.name || 'Cliente Sabor do Açaí').trim();
    const buyerEmail = String(buyer?.email || `${rawPhone || 'cliente'}@sabordoacai.com.br`).trim();

    // 4. Parâmetros da API BuckPay
    const buckpayToken = process.env.BUCKPAY_TOKEN?.trim();
    const buckpayUserAgent = process.env.BUCKPAY_USER_AGENT?.trim() || 'SaborDoAcai/1.0';
    const buckpayApiUrl = (process.env.BUCKPAY_API_URL?.trim() || 'https://api.realtechdev.com.br').replace(/\/+$/, '');
    const appUrl = (process.env.APP_URL?.trim() || `http://localhost:${PORT}`).replace(/\/+$/, '');

    let pixCode = '';
    let qrCodeBase64: string | undefined = undefined;
    let buckpayTransactionId: string | undefined = undefined;

    // 5. Integração com a API da BuckPay se o token estiver configurado
    const isTokenConfigured = Boolean(
      buckpayToken &&
      buckpayToken !== 'YOUR_BUCKPAY_40_CHARACTER_TOKEN' &&
      buckpayToken.length >= 20
    );

    if (isTokenConfigured) {
      try {
        const payload: Record<string, any> = {
          external_id: orderId,
          payment_method: 'pix',
          amount: totalAmountCents,
          buyer: {
            name: buyerName,
            email: buyerEmail,
            phone: phoneFormatted,
          },
          product: {
            name: 'Sabor do Açaí - Pedido',
          },
          postbackUrl: `${appUrl}/api/webhooks/buckpay`,
        };

        if (rawCpf && isValidCPF(rawCpf)) {
          payload.buyer.document = rawCpf;
        }

        const buckpayResponse = await fetch(`${buckpayApiUrl}/v1/transactions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${buckpayToken}`,
            'User-Agent': buckpayUserAgent,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await buckpayResponse.json();

        if (buckpayResponse.ok && data?.data) {
          buckpayTransactionId = data.data.id;
          pixCode = data.data.pix?.code || '';
          qrCodeBase64 = data.data.pix?.qrcode_base64;
        } else {
          console.warn('[BuckPay] Resposta da API:', data);
        }
      } catch (apiErr) {
        console.error('[BuckPay] Erro de conexão com a API BuckPay:', apiErr);
      }
    }

    // Fallback garantido se a chave ainda não estiver cadastrada no painel
    if (!pixCode) {
      pixCode = generateBRCode(
        'financeiro@sabordoacai.com.br',
        'Sabor do Acai',
        'Sao Paulo',
        serverTotal,
        orderId.slice(-20)
      );
    }

    // 6. Armazenar o pedido no servidor com status 'pending'
    const record: OrderRecord = {
      id: orderId,
      externalId: orderId,
      buckpayTransactionId,
      status: 'pending',
      amountCents: totalAmountCents,
      totalAmount: serverTotal,
      pixCode,
      qrCodeBase64,
      createdAt: new Date().toISOString(),
      buyer: {
        name: buyerName,
        email: buyerEmail,
        phone: rawPhone,
        document: rawCpf,
      },
      address,
      items: verifiedItems,
    };

    orders.set(orderId, record);

    // 7. Retornar ao frontend SOMENTE os dados necessários para o pagamento (sem chaves secretas)
    return res.status(201).json({
      success: true,
      orderId,
      externalId: orderId,
      status: 'pending',
      totalAmount: serverTotal,
      totalAmountCents,
      pixCode,
      qrCodeBase64,
    });
  } catch (err: any) {
    console.error('[BuckPay] Falha ao processar pedido:', err);
    return res.status(500).json({ error: 'Erro ao gerar cobrança PIX.' });
  }
});

// =========================================================================
// ROTA: Webhook da BuckPay (POST /api/webhooks/buckpay)
// =========================================================================
app.post('/api/webhooks/buckpay', (req: Request, res: Response) => {
  try {
    const { event, data } = req.body || {};
    const externalId = data?.external_id;
    const txId = data?.id;

    if (!externalId && !txId) {
      return res.status(400).json({ error: 'Identificador não fornecido no webhook.' });
    }

    // Localizar pedido pelo external_id ou buckpayTransactionId
    let order: OrderRecord | undefined = undefined;
    if (externalId && orders.has(externalId)) {
      order = orders.get(externalId);
    } else {
      for (const ord of orders.values()) {
        if (ord.buckpayTransactionId === txId || ord.id === externalId) {
          order = ord;
          break;
        }
      }
    }

    if (!order) {
      console.warn(`[BuckPay Webhook] Pedido não encontrado para externalId: ${externalId || txId}`);
      return res.status(200).json({ received: true, note: 'Order not found in memory' });
    }

    // Processar eventos oficiais da BuckPay
    if (event === 'transaction.processed' || data?.status === 'paid') {
      order.status = 'paid';
      order.paidAt = new Date().toISOString();
      console.log(`[BuckPay Webhook] Pedido ${order.id} confirmado como PAGO.`);
    } else if (event === 'transaction.cancelled' || data?.status === 'cancelled') {
      order.status = 'cancelled';
      console.log(`[BuckPay Webhook] Pedido ${order.id} marcado como CANCELADO.`);
    } else if (event === 'transaction.expired' || data?.status === 'expired') {
      order.status = 'expired';
      console.log(`[BuckPay Webhook] Pedido ${order.id} marcado como EXPIRADO.`);
    }

    return res.status(200).json({ received: true, orderId: order.id, status: order.status });
  } catch (err) {
    console.error('[BuckPay Webhook] Erro ao processar webhook:', err);
    return res.status(500).json({ error: 'Erro ao processar notificação.' });
  }
});

// =========================================================================
// ROTA: Consultar status do pedido PIX (GET /api/pix/status/:orderId)
// =========================================================================
app.get('/api/pix/status/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  // Se ainda estiver pendente e tivermos token BuckPay, tentar consultar status atualizado na API
  const buckpayToken = process.env.BUCKPAY_TOKEN?.trim();
  const buckpayUserAgent = process.env.BUCKPAY_USER_AGENT?.trim() || 'SaborDoAcai/1.0';
  const buckpayApiUrl = (process.env.BUCKPAY_API_URL?.trim() || 'https://api.realtechdev.com.br').replace(/\/+$/, '');

  const isTokenConfigured = Boolean(
    buckpayToken &&
    buckpayToken !== 'YOUR_BUCKPAY_40_CHARACTER_TOKEN' &&
    buckpayToken.length >= 20
  );

  if (order.status === 'pending' && isTokenConfigured) {
    try {
      const resp = await fetch(`${buckpayApiUrl}/v1/transactions/external_id/${order.externalId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${buckpayToken}`,
          'User-Agent': buckpayUserAgent,
        },
      });

      if (resp.ok) {
        const json = await resp.json();
        const currentStatus = json?.data?.status;
        if (currentStatus === 'paid') {
          order.status = 'paid';
          order.paidAt = new Date().toISOString();
        } else if (currentStatus === 'cancelled') {
          order.status = 'cancelled';
        } else if (currentStatus === 'expired') {
          order.status = 'expired';
        }
      }
    } catch (e) {
      // Ignora erro de checagem para não interromper a resposta
    }
  }

  return res.json({
    success: true,
    orderId: order.id,
    status: order.status,
    amount: order.totalAmount,
    paidAt: order.paidAt,
  });
});

// =========================================================================
// ROTA DE TESTE LOCAL/SANDBOX: Simular confirmação de pagamento
// =========================================================================
app.post('/api/pix/simulate-payment/:orderId', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  return res.json({ success: true, orderId: order.id, status: order.status });
});

// =========================================================================
// Configuração do Vite para desenvolvimento e estático para produção
// =========================================================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Sabor Do Açaí rodando na porta ${PORT}`);
  });
}

startServer();
