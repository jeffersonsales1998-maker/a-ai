import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, Navigation, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LocationPopupProps {
  onClose: () => void;
}

const BRAZILIAN_STATES = [
  'São Paulo (SP)',
  'Rio de Janeiro (RJ)',
  'Minas Gerais (MG)',
  'Bahia (BA)',
  'Paraná (PR)',
  'Rio Grande do Sul (RS)',
  'Pernambuco (PE)',
  'Ceará (CE)',
  'Pará (PA)',
  'Santa Catarina (SC)',
  'Goiás (GO)',
  'Maranhão (MA)',
  'Amazonas (AM)',
  'Espírito Santo (ES)',
  'Paraíba (PB)',
  'Mato Grosso (MT)',
  'Rio Grande do Norte (RN)',
  'Alagoas (AL)',
  'Piauí (PI)',
  'Distrito Federal (DF)',
  'Mato Grosso do Sul (MS)',
  'Sergipe (SE)',
  'Rondônia (RO)',
  'Tocantins (TO)',
  'Acre (AC)',
  'Amapá (AP)',
  'Roraima (RR)',
];

export const LocationPopup: React.FC<LocationPopupProps> = ({ onClose }) => {
  const { setUserCity } = useApp();
  const [step, setStep] = useState<'detecting' | 'confirm' | 'select'>('detecting');
  const [detectedCity, setDetectedCity] = useState('');
  const [detectedState, setDetectedState] = useState('');
  const [selectedState, setSelectedState] = useState('São Paulo (SP)');
  const [manualCity, setManualCity] = useState('');

  useEffect(() => {
    let active = true;

    const detect = async () => {
      try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const data = await res.json();
        if (active && data.city) {
          const cityCap = data.city.replace(/\b\w/g, (l: string) => l.toUpperCase());
          setDetectedCity(cityCap);
          setDetectedState(data.region || 'SP');
          setStep('confirm');
          return;
        }
      } catch {}

      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (active && data.city) {
          setDetectedCity(data.city);
          setDetectedState(data.region_code || 'SP');
          setStep('confirm');
          return;
        }
      } catch {}

      if (active) {
        setDetectedCity('São Paulo');
        setDetectedState('SP');
        setStep('confirm');
      }
    };

    detect();

    return () => {
      active = false;
    };
  }, []);

  const handleConfirm = (city: string) => {
    setUserCity(city);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10 animate-slide-up">
        {step === 'detecting' && (
          <div className="py-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-[#ea1d2c] animate-pulse">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-gray-900">
                Localizando sua região...
              </h3>
              <p className="text-[13px] text-gray-500 mt-1">
                Buscando a loja Sabor Do Açaí mais próxima
              </p>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <MapPin className="w-7 h-7" />
            </div>

            <h3 className="text-[18px] font-bold text-gray-900 leading-snug">
              Você está em {detectedCity}?
            </h3>
            <p className="text-[13px] text-gray-500 mt-1 max-w-[300px]">
              Identificamos sua cidade para verificar a disponibilidade de entrega grátis hoje!
            </p>

            <div className="mt-6 w-full space-y-2.5">
              <button
                onClick={() => handleConfirm(detectedCity)}
                className="w-full bg-[#ea1d2c] hover:bg-[#d41825] text-white font-bold h-12 rounded-xl text-[15px] flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                Sim, ver cardápio
              </button>

              <button
                onClick={() => setStep('select')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold h-11 rounded-xl text-[14px] cursor-pointer active:scale-98 transition-all"
              >
                Não, alterar minha cidade
              </button>
            </div>
          </div>
        )}

        {step === 'select' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-50 text-[#ea1d2c] flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-gray-900">
                  Selecione sua cidade
                </h3>
                <p className="text-[12px] text-gray-500">
                  Para conferir os combos disponíveis
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-gray-700 block mb-1">
                  Estado (UF)
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-300 text-[14px] bg-white text-gray-800 focus:outline-none focus:border-[#ea1d2c]"
                >
                  {BRAZILIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-medium text-gray-700 block mb-1">
                  Nome da Cidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo, Campinas, Curitiba..."
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-300 text-[14px] bg-white text-gray-800 focus:outline-none focus:border-[#ea1d2c]"
                />
              </div>

              <button
                onClick={() => {
                  const cityToSet = manualCity.trim() || detectedCity || 'São Paulo';
                  handleConfirm(cityToSet);
                }}
                className="w-full mt-2 bg-[#ea1d2c] hover:bg-[#d41825] text-white font-bold h-12 rounded-xl text-[15px] cursor-pointer shadow-md active:scale-98 transition-all"
              >
                Confirmar e Continuar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
