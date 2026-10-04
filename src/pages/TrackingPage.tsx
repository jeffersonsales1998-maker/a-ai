import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  Bike,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  Store,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface TrackingStep {
  id: string;
  label: string;
  description: string;
  delaySec: number;
}

const steps: TrackingStep[] = [
  {
    id: 'confirmed',
    label: 'Pedido confirmado',
    description: 'O restaurante confirmou o seu pedido',
    delaySec: 0,
  },
  {
    id: 'preparing',
    label: 'Preparando seu açaí',
    description: 'Montando o açaí cremoso com seus complementos',
    delaySec: 15,
  },
  {
    id: 'ready',
    label: 'Pronto para retirada',
    description: 'Embalagem lacrada, aguardando o entregador',
    delaySec: 35,
  },
  {
    id: 'on_the_way',
    label: 'Saiu para entrega',
    description: 'Entregador parceiro a caminho do seu endereço',
    delaySec: 55,
  },
  {
    id: 'delivered',
    label: 'Pedido entregue',
    description: 'Entregue com sucesso! Tenha um ótimo açaí 💜',
    delaySec: 80,
  },
];

export const TrackingPage: React.FC = () => {
  const { address, items, totalPrice, customerName, navigate, clearCart } = useApp();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Clear cart now that order is confirmed
  useEffect(() => {
    clearCart();
  }, []);

  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get('orderId') || '849201';

  useEffect(() => {
    const timers = steps.map((st, idx) => {
      if (idx === 0) return null;
      return setTimeout(() => {
        setCurrentStepIndex(idx);
      }, st.delaySec * 1000);
    });

    return () => {
      timers.forEach((t) => t && clearTimeout(t));
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F2F2] max-w-[640px] mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-xs">
        <div className="flex items-center justify-between h-[56px] px-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center -ml-2 text-[#EA1D2C] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1
            className="text-[16px] font-bold text-gray-800 tracking-wide"
            style={{ letterSpacing: '0.04em' }}
          >
            ACOMPANHAR PEDIDO
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Status card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#EA1D2C] to-[#16a34a]" />

          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            {currentStepIndex >= 3 ? (
              <Bike className="w-8 h-8 animate-bounce" />
            ) : currentStepIndex === 0 ? (
              <CheckCircle2 className="w-8 h-8 text-[#16a34a]" />
            ) : (
              <Store className="w-8 h-8 text-[#EA1D2C]" />
            )}
          </div>

          <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            {steps[currentStepIndex].label}
          </span>

          <h2 className="text-[20px] font-bold text-gray-900 mt-2">
            Pedido #{orderId}
          </h2>
          <p className="text-[13px] text-gray-500 mt-1 max-w-[320px] mx-auto">
            {steps[currentStepIndex].description}
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[14px] text-gray-700 font-medium">
            <Clock className="w-4 h-4 text-[#EA1D2C]" />
            <span>Previsão de entrega: <strong>30 - 45 min</strong></span>
          </div>
        </div>

        {/* Timeline steps */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-[15px] font-bold text-gray-900 mb-4">
            Etapas do pedido
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {steps.map((st, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={st.id} className="relative">
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                      isPast || isCurrent
                        ? 'border-[#16a34a] bg-[#16a34a] text-white'
                        : 'border-gray-300 bg-white text-gray-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>

                  <div>
                    <p
                      className={`text-[14px] font-bold leading-tight ${
                        isCurrent
                          ? 'text-[#EA1D2C]'
                          : isPast
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {st.label}
                    </p>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      {st.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address Details */}
        {address && (
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-[14px] mb-2">
              <MapPin className="w-4 h-4 text-[#EA1D2C]" />
              <span>Endereço de entrega</span>
            </div>
            <div className="text-[13px] text-gray-600 leading-relaxed pl-6">
              <p className="font-semibold text-gray-800">
                {address.street}, {address.number}
                {address.complement ? ` - ${address.complement}` : ''}
              </p>
              <p>
                {address.neighborhood} • {address.city} - {address.state}
              </p>
              <p className="text-gray-400 text-[12px] mt-0.5">
                CEP: {address.cep}
              </p>
            </div>
          </div>
        )}

        {/* Need Help / Support button */}
        <div className="space-y-2">
          <a
            href="https://api.whatsapp.com/send?phone=5511999999999&text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20meu%20pedido%20no%20Sabor%20do%20A%C3%A7a%C3%AD"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl text-[14px] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Falar com suporte via WhatsApp
          </a>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold h-11 rounded-xl text-[14px] border border-gray-200 cursor-pointer transition-all"
          >
            Voltar para a página inicial
          </button>
        </div>
      </main>
    </div>
  );
};
