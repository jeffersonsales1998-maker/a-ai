import React, { useState } from 'react';
import { ChevronLeft, Search, Loader2, MapPin } from 'lucide-react';
import { Address } from '../types';
import { useApp } from '../context/AppContext';

export const AddressPage: React.FC = () => {
  const { address, setAddress, navigate } = useApp();

  const [form, setForm] = useState<Address>(
    address || {
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCep, setLoadingCep] = useState(false);

  const formatCep = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 8);
    return raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setForm((prev) => ({ ...prev, cep: formatted }));

    const raw = formatted.replace(/\D/g, '');
    if (raw.length === 8) {
      searchCep(raw);
    }
  };

  const searchCep = async (cepNumbers: string) => {
    setLoadingCep(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.cep;
      return next;
    });

    try {
      // 1. Try ViaCEP
      const res = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        setLoadingCep(false);
        return;
      }
    } catch {}

    try {
      // 2. Try BrasilAPI fallback
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepNumbers}`);
      const data = await res.json();
      if (data && !data.errors) {
        setForm((prev) => ({
          ...prev,
          street: data.street || prev.street,
          neighborhood: data.neighborhood || prev.neighborhood,
          city: data.city || prev.city,
          state: data.state || prev.state,
        }));
        setLoadingCep(false);
        return;
      }
    } catch {}

    setErrors((prev) => ({
      ...prev,
      cep: 'CEP não encontrado. Preencha o endereço manualmente.',
    }));
    setLoadingCep(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const rawCep = form.cep.replace(/\D/g, '');
    if (rawCep.length !== 8) {
      newErrors.cep = 'CEP inválido';
    }
    if (!form.street.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }
    if (!form.number.trim()) {
      newErrors.number = 'Número é obrigatório';
    }
    if (!form.neighborhood.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }
    if (!form.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }
    if (!form.state.trim()) {
      newErrors.state = 'Estado é obrigatório';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setAddress(form);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] max-w-[640px] mx-auto pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-xs">
        <div className="flex items-center h-[56px] px-4">
          <button
            onClick={() => navigate('/sacola')}
            className="w-10 h-10 flex items-center justify-center -ml-2 text-[#EA1D2C] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1
            className="flex-1 text-center mr-8"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#3E3E3E',
              letterSpacing: '0.04em',
            }}
          >
            ENDEREÇO DE ENTREGA
          </h1>
        </div>
      </header>

      <div className="p-4">
        {/* Banner with pin */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 text-[#EA1D2C] flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-gray-900">
              Onde vamos entregar seu açaí?
            </p>
            <p className="text-[12px] text-gray-500">
              Entrega rápida de 30 a 45 minutos com taxa grátis!
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
          {/* CEP input */}
          <div>
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
              CEP <span className="text-[#ea1d2c]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="00000-000"
                value={form.cep}
                onChange={handleCepChange}
                maxLength={9}
                className={`w-full h-12 px-3.5 pr-12 rounded-xl border text-[15px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#EA1D2C] ${
                  errors.cep ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                {loadingCep ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#EA1D2C]" />
                ) : (
                  <Search
                    className="w-5 h-5 cursor-pointer hover:text-gray-600"
                    onClick={() => {
                      const raw = form.cep.replace(/\D/g, '');
                      if (raw.length === 8) searchCep(raw);
                    }}
                  />
                )}
              </div>
            </div>
            {errors.cep && (
              <p className="text-[12px] text-red-500 mt-1">{errors.cep}</p>
            )}
          </div>

          {/* Rua */}
          <div>
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
              Rua / Avenida <span className="text-[#ea1d2c]">*</span>
            </label>
            <input
              type="text"
              placeholder="Nome da sua rua"
              value={form.street}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, street: e.target.value }))
              }
              className={`w-full h-12 px-3.5 rounded-xl border text-[15px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#EA1D2C] ${
                errors.street ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
              }`}
            />
            {errors.street && (
              <p className="text-[12px] text-red-500 mt-1">{errors.street}</p>
            )}
          </div>

          {/* Número & Complemento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
                Número <span className="text-[#ea1d2c]">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 123"
                value={form.number}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, number: e.target.value }))
                }
                className={`w-full h-12 px-3.5 rounded-xl border text-[15px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#EA1D2C] ${
                  errors.number ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                }`}
              />
              {errors.number && (
                <p className="text-[12px] text-red-500 mt-1">{errors.number}</p>
              )}
            </div>

            <div>
              <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
                Complemento
              </label>
              <input
                type="text"
                placeholder="Apto, Bloco..."
                value={form.complement || ''}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, complement: e.target.value }))
                }
                className="w-full h-12 px-3.5 rounded-xl border border-gray-200 text-[15px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#EA1D2C]"
              />
            </div>
          </div>

          {/* Bairro */}
          <div>
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
              Bairro <span className="text-[#ea1d2c]">*</span>
            </label>
            <input
              type="text"
              placeholder="Bairro"
              value={form.neighborhood}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, neighborhood: e.target.value }))
              }
              className={`w-full h-12 px-3.5 rounded-xl border text-[15px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#EA1D2C] ${
                errors.neighborhood ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
              }`}
            />
            {errors.neighborhood && (
              <p className="text-[12px] text-red-500 mt-1">{errors.neighborhood}</p>
            )}
          </div>

          {/* Cidade & Estado */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
                Cidade <span className="text-[#ea1d2c]">*</span>
              </label>
              <input
                type="text"
                placeholder="Cidade"
                value={form.city}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, city: e.target.value }))
                }
                className={`w-full h-12 px-3.5 rounded-xl border text-[15px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#EA1D2C] ${
                  errors.city ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                }`}
              />
              {errors.city && (
                <p className="text-[12px] text-red-500 mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
                Estado <span className="text-[#ea1d2c]">*</span>
              </label>
              <input
                type="text"
                placeholder="UF"
                maxLength={2}
                value={form.state}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    state: e.target.value.toUpperCase(),
                  }))
                }
                className={`w-full h-12 px-3.5 rounded-xl border text-[15px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#EA1D2C] text-center uppercase ${
                  errors.state ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                }`}
              />
              {errors.state && (
                <p className="text-[12px] text-red-500 mt-1">{errors.state}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-[#EA1D2C] hover:bg-[#d41825] text-white font-bold h-12 rounded-xl text-[15px] cursor-pointer shadow-md active:scale-98 transition-all"
          >
            Confirmar endereço e ir ao pagamento
          </button>
        </form>
      </div>
    </div>
  );
};
