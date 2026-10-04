import React, { useState, useEffect } from 'react';
import { Star, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const { navigate, userCity } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="relative bg-white -mb-6">
      <div className="relative h-[160px] overflow-visible">
        <img
          src="/cover-acai.jpg"
          alt="Sabor Do Açaí"
          className="w-full h-full object-cover"
          width={640}
          height={160}
          fetchPriority="high"
          referrerPolicy="no-referrer"
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-[34px] z-20 w-[92px] h-[92px] rounded-full border-[4px] border-white bg-white flex items-center justify-center overflow-hidden"
          style={{ boxShadow: '0 10px 22px rgba(0,0,0,0.25)' }}
        >
          <img
            src="/logo-sabor-acai.jpg"
            alt="Sabor Do Açaí"
            className="w-full h-full object-cover rounded-full"
            width={92}
            height={92}
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="relative -top-6 mx-auto max-w-[420px] px-4 pb-2">
        <div
          className="bg-white rounded-3xl pt-14 px-6 pb-6 text-left"
          style={{ boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)' }}
        >
          <h1 className="text-[24px] font-bold text-[#000000] mb-1 text-left">
            Sabor Do Açaí
          </h1>

          <div className="text-[14px] text-[#6b7280] font-normal leading-snug">
            <span>{(mounted && userCity) || 'Carregando cidade...'}</span> - 4,5 km • Pedido mín. R$ 15,99
          </div>

          <div className="w-full h-px bg-[#e5e7eb] my-2" />

          <button
            onClick={() => navigate('/avaliacoes')}
            className="flex items-center w-full active:opacity-70 transition-opacity cursor-pointer text-left"
          >
            <span className="inline-flex items-center gap-1.5 text-[#111827]">
              <Star className="w-3.5 h-3.5 fill-[#111827] text-[#111827]" />
              <span className="text-[14px] font-semibold">4,9 (2.136 avaliações)</span>
              <img
                src="/assets/verificado.svg"
                alt="Verificado"
                className="w-4 h-4 inline-block"
                referrerPolicy="no-referrer"
              />
              <span className="font-normal text-[14px] text-[#000000]">Super</span>
            </span>
            <span className="ml-auto text-[#111827] text-[16px] font-medium">
              <ChevronRight className="w-4 h-4 text-[#111827]" />
            </span>
          </button>

          <div className="w-full h-px bg-[#e5e7eb] my-2" />

          <div className="text-[14px]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#111827]">Entrega padrão (30-45 min)</span>
              <span className="text-[#047857] font-semibold">Grátis</span>
            </div>
            <div className="text-[14px] text-[#6b7280] font-normal mt-2">
              Mais opções disponíveis na sacola
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
