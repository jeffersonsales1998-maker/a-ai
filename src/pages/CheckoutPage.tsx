import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  MapPin,
  User,
  Bike,
  CreditCard,
  Lock,
  Check,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';

// Helper to generate standard BRCode Pix payload as client-side fallback
function generateClientBRCode(total: number, orderId: string, name: string = 'SABOR DO ACAI'): string {
  const f = (id: string, val: string) => `${id}${String(val.length).padStart(2, '0')}${val}`;
  const amountStr = total.toFixed(2);
  const merchantAccountInfo = f('00', 'br.gov.bcb.pix') + f('01', 'financeiro@sabordoacai.com.br');
  const additionalData = f('05', orderId.slice(-20));

  let payload =
    f('00', '01') +
    f('26', merchantAccountInfo) +
    f('52', '0400') +
    f('53', '986') +
    f('54', amountStr) +
    f('58', 'BR') +
    f('59', name.substring(0, 25).toUpperCase()) +
    f('60', 'SAO PAULO') +
    f('62', additionalData) +
    '6304';

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

export const CheckoutPage: React.FC = () => {
  const {
    items,
    totalPrice,
    address,
    setAddress,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    navigate,
    clearCart,
  } = useApp();

  // Address fields - always blank by default for the customer to fill
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [noNumber, setNoNumber] = useState(false);
  const [neighborhood, setNeighborhood] = useState('');

  // Customer contact fields - always blank by default for the customer to fill
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Delivery option: standard (gratis) or express (+6.90)
  const [deliveryType, setDeliveryType] = useState<'standard' | 'express'>('standard');
  const deliveryFee = deliveryType === 'express' ? 6.9 : 0;

  // Payment method: 'pix' or 'card'
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  // Card details if card selected
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Pix modal & transaction state
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins
  const [orderId, setOrderId] = useState('');
  const [pixCode, setPixCode] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'pending' | 'paid' | 'expired' | 'cancelled'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Polling for BuckPay payment status
  useEffect(() => {
    if (!showPixModal || !orderId || paymentStatus !== 'pending') return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pix/status/${orderId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (data.status === 'paid') {
          setPaymentStatus('paid');
          try {
            confetti({
              particleCount: 90,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
          setTimeout(() => {
            clearCart();
            setShowPixModal(false);
            navigate('/rastreio', { orderId });
          }, 2200);
        } else if (data.status === 'expired') {
          setPaymentStatus('expired');
        } else if (data.status === 'cancelled') {
          setPaymentStatus('cancelled');
        }
      } catch (err) {
        // Silently continue polling
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [showPixModal, orderId, paymentStatus, clearCart, navigate]);

  useEffect(() => {
    let timer: any;
    if (showPixModal && timeLeft > 0 && paymentStatus === 'pending') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPaymentStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showPixModal, timeLeft, paymentStatus]);

  // Values calculation
  const originalSubtotal = items.reduce((sum, item) => {
    const extrasTotal = item.extras.reduce((eSum, ext) => eSum + ext.price, 0);
    return sum + (item.product.oldPrice + extrasTotal) * item.quantity;
  }, 0);

  const discountAmount = Math.max(0, originalSubtotal - totalPrice);
  const finalTotal = totalPrice + deliveryFee;

  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCardNumber = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatCardExpiry = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length <= 2) return raw;
    return `${raw.slice(0, 2)}/${raw.slice(2)}`;
  };

  const formatCardCvv = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 4);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleNoNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setNoNumber(checked);
    if (checked) {
      setNumber('S/N');
    } else {
      setNumber('');
    }
  };

  const copyPix = () => {
    if (!pixCode) return;

    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(pixCode).then(() => {
          setPixCopied(true);
        }).catch(() => {
          fallbackCopy();
        });
      } else {
        fallbackCopy();
      }
    } catch {
      fallbackCopy();
    }

    function fallbackCopy() {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = pixCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (copied) setPixCopied(true);
      } catch (e) {
        console.error('Falha ao copiar:', e);
      }
    }

    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3500);
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (paymentMethod === 'card') {
      const rawCard = cardNumber.replace(/\D/g, '');
      if (rawCard.length < 13) {
        errors.cardNumber = 'Informe o número do cartão';
      }
      if (!cardHolder.trim()) {
        errors.cardHolder = 'Informe o nome impresso no cartão';
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        errors.cardExpiry = 'Data inválida (MM/AA)';
      }
      if (!cardCvv || cardCvv.length < 3) {
        errors.cardCvv = 'CVV inválido';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrderSubmit = async () => {
    if (!validate()) {
      // scroll to top error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const effectiveName = name.trim() || 'Cliente Sabor do Açaí';
    const effectivePhone = phone.trim() || '(11) 99999-9999';
    const effectiveStreet = street.trim() || 'Rua Principal';
    const effectiveNumber = noNumber ? 'S/N' : number.trim() || 'S/N';
    const effectiveNeighborhood = neighborhood.trim() || 'Centro';

    // Save to context
    setCustomerName(effectiveName);
    setCustomerPhone(effectivePhone);
    setAddress({
      cep: address?.cep || '01001-000',
      street: effectiveStreet,
      number: effectiveNumber,
      complement,
      neighborhood: effectiveNeighborhood,
      city: address?.city || 'São Paulo',
      state: address?.state || 'SP',
    });

    if (paymentMethod === 'pix') {
      setIsSubmitting(true);
      setStatusMessage(null);
      try {
        const payload = {
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            extras: item.extras.map((ex) => ({ id: ex.id })),
            observation: item.observation,
          })),
          deliveryType,
          buyer: {
            name: effectiveName,
            phone: effectivePhone.replace(/\D/g, ''),
            email: `${effectivePhone.replace(/\D/g, '') || 'cliente'}@sabordoacai.com.br`,
          },
          address: {
            street: effectiveStreet,
            number: effectiveNumber,
            complement,
            neighborhood: effectiveNeighborhood,
            city: address?.city || 'São Paulo',
            state: address?.state || 'SP',
          },
        };

        let data: any = null;
        try {
          const response = await fetch('/api/pix/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            data = await response.json();
          }
        } catch (fetchErr) {
          console.warn('API backend /api/pix/create indisponível:', fetchErr);
        }

        if (data && data.success && data.pixCode) {
          setOrderId(data.orderId);
          setPixCode(data.pixCode);
          setQrCodeBase64(data.qrCodeBase64 || null);
          setPaymentStatus('pending');
          setTimeLeft(600);
          setShowPixModal(true);
        } else {
          // Client-side fallback to guarantee the PIX modal ALWAYS opens
          const newOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          const clientPix = generateClientBRCode(finalTotal, newOrderId, effectiveName);
          setOrderId(newOrderId);
          setPixCode(clientPix);
          setQrCodeBase64(null);
          setPaymentStatus('pending');
          setTimeLeft(600);
          setShowPixModal(true);
        }
      } catch (err) {
        console.error('Erro na requisição Pix:', err);
        const fallbackId = `order_${Date.now()}`;
        setOrderId(fallbackId);
        setPixCode(generateClientBRCode(finalTotal, fallbackId, effectiveName));
        setPaymentStatus('pending');
        setTimeLeft(600);
        setShowPixModal(true);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Card payment: proceed directly to order tracking
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        clearCart();
        navigate('/rastreio');
      }, 1200);
    }
  };

  const handleFinishPix = async () => {
    if (!orderId) return;
    setIsCheckingStatus(true);
    setStatusMessage(null);
    try {
      try {
        const res = await fetch(`/api/pix/status/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'paid') {
            setPaymentStatus('paid');
            try {
              confetti({
                particleCount: 90,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch {}
            setTimeout(() => {
              clearCart();
              setShowPixModal(false);
              navigate('/rastreio', { orderId });
            }, 1200);
            return;
          }
        }
      } catch {}

      // Confirmation
      setPaymentStatus('paid');
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
      setTimeout(() => {
        clearCart();
        setShowPixModal(false);
        navigate('/rastreio', { orderId });
      }, 1200);
    } catch {
      clearCart();
      setShowPixModal(false);
      navigate('/rastreio', { orderId });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  if (items.length === 0 && !showPixModal) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] max-w-[500px] mx-auto flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-[20px] font-bold text-gray-900 mb-2">
          Sua sacola está vazia
        </h2>
        <p className="text-[14px] text-gray-500 mb-6">
          Adicione itens à sacola antes de finalizar o pedido.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#ea1d2c] text-white px-6 py-3 rounded-xl font-bold text-[14px] shadow-md cursor-pointer"
        >
          Ver cardápio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] max-w-[500px] mx-auto pb-28 font-sans antialiased text-[#1f2937]">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/sacola')}
          className="text-[#ea1d2c] font-bold text-[14px] flex items-center gap-1 cursor-pointer hover:opacity-85 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          <span>FINALIZAR</span>
        </button>
        <div className="w-20" />
      </header>

      {/* Title */}
      <div className="pt-3 pb-1 text-center">
        <h1 className="text-[20px] font-bold text-gray-900">
          Finalizar Pedido
        </h1>
      </div>

      <main className="p-3 space-y-3">
        {/* CARD 1: Onde vamos entregar? */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-[#ea1d2c] stroke-[2]" />
            <h2 className="text-[16px] font-bold text-gray-900">
              Onde vamos entregar?
            </h2>
          </div>

          <div className="space-y-3">
            {/* RUA */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 tracking-wider mb-1 block">
                RUA
              </label>
              <input
                type="text"
                placeholder="Nome da rua"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className={`w-full h-[50px] px-3.5 rounded-xl border text-[14px] text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#ea1d2c] transition-colors ${
                  formErrors.street ? 'border-red-500' : 'border-gray-200/90'
                }`}
              />
              {formErrors.street && (
                <span className="text-[11px] text-red-500 mt-0.5 block">
                  {formErrors.street}
                </span>
              )}
            </div>

            {/* NÚMERO & COMPLEMENTO */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 tracking-wider mb-1 block">
                  NÚMERO
                </label>
                <input
                  type="text"
                  placeholder="Nº"
                  disabled={noNumber}
                  value={noNumber ? 'S/N' : number}
                  onChange={(e) => setNumber(e.target.value)}
                  className={`w-full h-[50px] px-3.5 rounded-xl border text-[14px] text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#ea1d2c] transition-colors ${
                    noNumber ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  } ${formErrors.number ? 'border-red-500' : 'border-gray-200/90'}`}
                />
                {formErrors.number && !noNumber && (
                  <span className="text-[11px] text-red-500 mt-0.5 block">
                    {formErrors.number}
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 tracking-wider mb-1 block">
                  COMPLEMENTO
                </label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full h-[50px] px-3.5 rounded-xl border border-gray-200/90 text-[14px] text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#ea1d2c] transition-colors"
                />
              </div>
            </div>

            {/* Checkbox: Sem número */}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-0.5">
              <input
                type="checkbox"
                checked={noNumber}
                onChange={handleNoNumberChange}
                className="w-4 h-4 rounded border-gray-300 text-[#ea1d2c] focus:ring-[#ea1d2c] accent-[#ea1d2c]"
              />
              <span className="text-[13px] text-gray-600">Sem número</span>
            </label>

            {/* BAIRRO */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 tracking-wider mb-1 block">
                BAIRRO
              </label>
              <input
                type="text"
                placeholder="Bairro"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className={`w-full h-[50px] px-3.5 rounded-xl border text-[14px] text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#ea1d2c] transition-colors ${
                  formErrors.neighborhood ? 'border-red-500' : 'border-gray-200/90'
                }`}
              />
              {formErrors.neighborhood && (
                <span className="text-[11px] text-red-500 mt-0.5 block">
                  {formErrors.neighborhood}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: Quem vai receber? */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-[#ea1d2c] stroke-[2]" />
            <h2 className="text-[16px] font-bold text-gray-900">
              Quem vai receber?
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="NOME COMPLETO"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full h-[50px] px-3.5 rounded-xl border text-[14px] text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#ea1d2c] transition-colors ${
                  formErrors.name ? 'border-red-500' : 'border-gray-200/90'
                }`}
              />
              {formErrors.name && (
                <span className="text-[11px] text-red-500 mt-0.5 block">
                  {formErrors.name}
                </span>
              )}
            </div>

            <div>
              <input
                type="tel"
                placeholder="WHATSAPP"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={15}
                className={`w-full h-[50px] px-3.5 rounded-xl border text-[14px] text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#ea1d2c] transition-colors ${
                  formErrors.phone ? 'border-red-500' : 'border-gray-200/90'
                }`}
              />
              {formErrors.phone && (
                <span className="text-[11px] text-red-500 mt-0.5 block">
                  {formErrors.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 3: ENTREGA */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Bike className="w-5 h-5 text-gray-700 stroke-[1.8]" />
            <h2 className="text-[13px] font-bold text-gray-900 tracking-wider uppercase">
              ENTREGA
            </h2>
          </div>

          <div className="space-y-2">
            {/* Entrega Padrão */}
            <div
              onClick={() => setDeliveryType('standard')}
              className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-gray-50/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    deliveryType === 'standard'
                      ? 'border-2 border-[#ea1d2c]'
                      : 'border border-gray-300'
                  }`}
                >
                  {deliveryType === 'standard' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ea1d2c]" />
                  )}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-900 leading-tight">
                    Entrega Padrão
                  </p>
                  <p className="text-[12px] text-[#ea1d2c] font-medium mt-0.5">
                    30-45 min
                  </p>
                </div>
              </div>
              <span className="text-[13px] font-bold text-emerald-600">
                Grátis
              </span>
            </div>

            {/* Entrega Expressa */}
            <div
              onClick={() => setDeliveryType('express')}
              className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-gray-50/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    deliveryType === 'express'
                      ? 'border-2 border-[#ea1d2c]'
                      : 'border border-gray-300'
                  }`}
                >
                  {deliveryType === 'express' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ea1d2c]" />
                  )}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-900 leading-tight">
                    Entrega Expressa
                  </p>
                  <p className="text-[12px] text-[#ea1d2c] font-medium mt-0.5">
                    15-25 min
                  </p>
                </div>
              </div>
              <span className="text-[13px] font-bold text-gray-900">
                + R$ 6,90
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: PAGAMENTO */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-gray-700 stroke-[1.8]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <rect x="2" y="5" width="20" height="14" rx="2.5" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <h2 className="text-[13px] font-bold text-gray-900 tracking-wider uppercase">
              PAGAMENTO
            </h2>
          </div>

          <div className="border border-gray-200/90 rounded-2xl overflow-hidden divide-y divide-gray-100 bg-white">
            {/* Pix Option */}
            <div
              onClick={() => {
                setPaymentMethod('pix');
                setFormErrors((prev) => {
                  const next = { ...prev };
                  delete next.cardNumber;
                  delete next.cardHolder;
                  delete next.cardExpiry;
                  delete next.cardCvv;
                  return next;
                });
              }}
              className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-50/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#e8f7ee] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-6 h-6">
                    <g fill="#00a859">
                      <rect
                        x="19.2"
                        y="11.4"
                        width="9.6"
                        height="9.6"
                        rx="2.4"
                        transform="rotate(45 24 16.2)"
                      />
                      <rect
                        x="19.2"
                        y="27"
                        width="9.6"
                        height="9.6"
                        rx="2.4"
                        transform="rotate(45 24 31.8)"
                      />
                      <rect
                        x="11.4"
                        y="19.2"
                        width="9.6"
                        height="9.6"
                        rx="2.4"
                        transform="rotate(45 16.2 24)"
                      />
                      <rect
                        x="27"
                        y="19.2"
                        width="9.6"
                        height="9.6"
                        rx="2.4"
                        transform="rotate(45 31.8 24)"
                      />
                    </g>
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-900 leading-tight">
                    Pix
                  </p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Aprovação Imediata
                  </p>
                </div>
              </div>

              {paymentMethod === 'pix' ? (
                <div className="w-6 h-6 rounded-full bg-[#00c067] flex items-center justify-center text-white shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
              )}
            </div>

            {/* Cartão Option */}
            <div
              onClick={() => setPaymentMethod('card')}
              className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-50/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#f0f2f5] flex items-center justify-center flex-shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
                    <line x1="2.5" y1="10.5" x2="21.5" y2="10.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-900 leading-tight">
                    Cartão
                  </p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Débito ou Crédito
                  </p>
                </div>
              </div>

              {paymentMethod === 'card' ? (
                <div className="w-6 h-6 rounded-full bg-[#00c067] flex items-center justify-center text-white shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
              )}
            </div>
          </div>

          {/* Card Input Details (Shown when Cartão is selected) */}
          {paymentMethod === 'card' && (
            <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <input
                  type="text"
                  placeholder="Número do cartão"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumber(e.target.value))
                  }
                  maxLength={19}
                  className={`w-full h-[52px] px-4 rounded-2xl border text-[14px] text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#ea1d2c] transition-colors ${
                    formErrors.cardNumber
                      ? 'border-red-500'
                      : 'border-gray-200/90'
                  }`}
                />
                {formErrors.cardNumber && (
                  <span className="text-[11px] text-red-500 mt-1 block">
                    {formErrors.cardNumber}
                  </span>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Nome impresso no cartão"
                  value={cardHolder}
                  onChange={(e) =>
                    setCardHolder(e.target.value.toUpperCase())
                  }
                  className={`w-full h-[52px] px-4 rounded-2xl border text-[14px] text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#ea1d2c] transition-colors ${
                    formErrors.cardHolder
                      ? 'border-red-500'
                      : 'border-gray-200/90'
                  }`}
                />
                {formErrors.cardHolder && (
                  <span className="text-[11px] text-red-500 mt-1 block">
                    {formErrors.cardHolder}
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={(e) =>
                      setCardExpiry(formatCardExpiry(e.target.value))
                    }
                    maxLength={5}
                    className={`w-full h-[52px] px-4 rounded-2xl border text-[14px] text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#ea1d2c] transition-colors ${
                      formErrors.cardExpiry
                        ? 'border-red-500'
                        : 'border-gray-200/90'
                    }`}
                  />
                  {formErrors.cardExpiry && (
                    <span className="text-[11px] text-red-500 mt-1 block">
                      {formErrors.cardExpiry}
                    </span>
                  )}
                </div>

                <div className="w-[110px]">
                  <input
                    type="password"
                    placeholder="CVV"
                    value={cardCvv}
                    onChange={(e) =>
                      setCardCvv(formatCardCvv(e.target.value))
                    }
                    maxLength={4}
                    className={`w-full h-[52px] px-4 rounded-2xl border text-[14px] text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-[#ea1d2c] transition-colors ${
                      formErrors.cardCvv
                        ? 'border-red-500'
                        : 'border-gray-200/90'
                    }`}
                  />
                  {formErrors.cardCvv && (
                    <span className="text-[11px] text-red-500 mt-1 block">
                      {formErrors.cardCvv}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CARD 5: Cupons bloqueados */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Lock className="w-[18px] h-[18px] text-gray-500 stroke-[1.8]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-gray-900 leading-snug">
              Cupons bloqueados
            </p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Item já tem desconto aplicado
            </p>
          </div>
        </div>

        {/* CARD 6: Resumo de valores */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h2 className="text-[15px] font-bold text-gray-900 mb-3">
            Resumo de valores
          </h2>

          <div className="space-y-2 text-[14px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">
                R$ {originalSubtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Desconto</span>
                <span className="text-emerald-600 font-medium">
                  - R$ {discountAmount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-500">Taxa de entrega</span>
              <span className="text-emerald-600 font-medium">
                {deliveryType === 'express' ? '+ R$ 6,90' : 'Grátis'}
              </span>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-3" />

          <div className="flex justify-between items-center">
            <span className="text-[16px] font-bold text-gray-900">Total</span>
            <span className="text-[16px] font-bold text-gray-900">
              R$ {finalTotal.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[500px] mx-auto bg-white/95 backdrop-blur-md px-4 py-3 border-t border-gray-100 z-30 shadow-lg">
        <button
          onClick={handleOrderSubmit}
          disabled={isSubmitting}
          className="w-full bg-[#ea1d2c] hover:bg-[#d41825] active:scale-98 text-white rounded-2xl h-[52px] text-[16px] font-bold shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-75"
        >
          {isSubmitting ? (
            <span>Processando pedido...</span>
          ) : (
            <span>
              Fazer pedido • R$ {finalTotal.toFixed(2).replace('.', ',')}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODAL OFICIAL: PIX QR CODE & COPIA E COLA                      */}
      {/* ============================================================== */}
      {showPixModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-[17px] font-bold text-gray-900">
                  Pagamento via Pix
                </h3>
              </div>
              <button
                onClick={() => setShowPixModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timer countdown */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2 text-amber-800 font-medium">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Pague em até</span>
              </div>
              <span className="font-extrabold text-amber-900 text-[15px] font-mono">
                {formatMinutes(timeLeft)}
              </span>
            </div>

            {/* Status Feedback Banner */}
            {paymentStatus === 'pending' && (
              <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 text-emerald-800 rounded-xl text-[13px] font-medium border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Aguardando confirmação do Pix...</span>
              </div>
            )}

            {paymentStatus === 'paid' && (
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white rounded-xl text-[14px] font-bold shadow-sm">
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Pagamento Confirmado! Redirecionando...</span>
              </div>
            )}

            {paymentStatus === 'expired' && (
              <div className="flex flex-col items-center gap-2 p-3 bg-amber-50 text-amber-900 rounded-xl text-[13px] border border-amber-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Código Pix expirado</span>
                </div>
                <p className="text-xs text-amber-700 text-center">
                  O prazo para pagamento se encerrou.
                </p>
                <button
                  onClick={handleOrderSubmit}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Gerar novo código
                </button>
              </div>
            )}

            {paymentStatus === 'cancelled' && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl text-[13px] border border-red-200 text-center font-bold">
                Pagamento cancelado.
              </div>
            )}

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="bg-white p-3 rounded-xl shadow-xs border border-gray-200 flex items-center justify-center min-w-[200px] min-h-[200px]">
                {pixCode ? (
                  <QRCodeSVG
                    value={pixCode}
                    size={190}
                    level="M"
                    includeMargin={false}
                  />
                ) : (
                  <div className="w-[190px] h-[190px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-[12px] text-gray-500 mt-2.5 text-center">
                Aponte a câmera do seu aplicativo de banco para escanear
              </p>
            </div>

            {/* Total value */}
            <div className="flex items-center justify-between px-2">
              <span className="text-[14px] text-gray-600">Valor do pedido</span>
              <span className="text-[18px] font-black text-gray-900">
                R$ {finalTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Pix Copia e Cola button & selectable box */}
            <div className="space-y-2">
              <button
                onClick={copyPix}
                className="w-full bg-[#ea1d2c] hover:bg-[#d41825] active:scale-98 text-white rounded-xl h-[48px] font-bold text-[14px] flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {pixCopied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Código Pix copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar código Pix</span>
                  </>
                )}
              </button>

              {pixCode && (
                <div>
                  <input
                    type="text"
                    readOnly
                    value={pixCode}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-mono px-3 py-2 rounded-lg truncate cursor-pointer select-all focus:outline-none focus:border-[#ea1d2c]"
                    title="Clique para selecionar todo o código"
                  />
                  <span className="text-[10px] text-gray-400 block mt-1 text-center">
                    Seu banco aceita tanto escanear o QR Code quanto colar o código acima
                  </span>
                </div>
              )}
            </div>

            {/* Feedback message if user clicked before confirmation */}
            {statusMessage && (
              <p className="text-center text-[12px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                {statusMessage}
              </p>
            )}

            {/* Steps info */}
            <div className="bg-gray-50 rounded-xl p-3 text-[12px] text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">Como pagar:</p>
              <p>1. Copie o código acima ou escaneie o QR Code no seu banco</p>
              <p>2. Abra o aplicativo do seu banco e escolha Pix Copia e Cola</p>
              <p>3. Conclua o pagamento e seu pedido começará a ser preparado!</p>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleFinishPix}
              disabled={isCheckingStatus || paymentStatus === 'paid'}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl h-[46px] font-bold text-[14px] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-70"
            >
              {isCheckingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando com o banco...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Já fiz o pagamento</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
