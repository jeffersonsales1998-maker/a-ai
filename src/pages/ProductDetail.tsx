import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Share2, Plus, Minus, Check } from 'lucide-react';
import { allProducts, coberturas, frutas, complementos, turbines } from '../data/products';
import { ExtraOption } from '../types';
import { useApp } from '../context/AppContext';

interface ProductDetailProps {
  productId: string;
}

const smoothScrollTo = (targetY: number, duration = 800) => {
  const startY = window.scrollY;
  const diff = targetY - startY;
  const startTime = performance.now();

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + diff * easeInOutCubic(progress));
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

export const ProductDetail: React.FC<ProductDetailProps> = ({ productId }) => {
  const { navigate, addItem, updateItem, navState } = useApp();

  const product = allProducts.find((p) => p.id === productId);

  const editItem = navState?.editItem;
  const isEditing = Boolean(editItem);

  const [quantity, setQuantity] = useState(editItem?.quantity || 1);
  const [selectedExtras, setSelectedExtras] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    if (editItem?.extras) {
      editItem.extras.forEach((ext: ExtraOption) => {
        map.set(ext.id, (map.get(ext.id) || 0) + 1);
      });
    }
    return map;
  });
  const [observation, setObservation] = useState(editItem?.observation || '');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">Produto não encontrado.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#ea1d2c] text-white px-6 py-2 rounded-xl font-medium"
        >
          Voltar ao cardápio
        </button>
      </div>
    );
  }

  const countCategory = (category: string) => {
    let list: ExtraOption[] = [];
    if (category === 'cobertura') list = coberturas;
    else if (category === 'fruta') list = frutas;
    else if (category === 'complemento') list = complementos;
    else if (category === 'turbine') list = turbines;

    let total = 0;
    list.forEach((item) => {
      total += selectedExtras.get(item.id) || 0;
    });
    return total;
  };

  const countCob = countCategory('cobertura');
  const countFruta = countCategory('fruta');
  const countComp = countCategory('complemento');
  const countTurb = countCategory('turbine');

  const MAX_COB = 2;
  const MAX_FRUTA = 2;
  const MAX_COMP = 4;
  const MAX_TURB = 1;

  const handleAddExtra = (item: ExtraOption) => {
    let nextSectionTitle: string | null = null;

    if (item.category === 'cobertura') {
      if (countCob >= MAX_COB) return;
      if (countCob + 1 === MAX_COB) nextSectionTitle = 'Frutas';
    } else if (item.category === 'fruta') {
      if (countFruta >= MAX_FRUTA) return;
      if (countFruta + 1 === MAX_FRUTA) nextSectionTitle = 'Complementos';
    } else if (item.category === 'complemento') {
      if (countComp >= MAX_COMP) return;
      if (countComp + 1 === MAX_COMP) nextSectionTitle = 'Turbine seu açaí';
    } else if (item.category === 'turbine') {
      if (countTurb >= MAX_TURB) return;
      if (countTurb + 1 === MAX_TURB) nextSectionTitle = 'Alguma observação?';
    }

    setSelectedExtras((prev) => {
      const next = new Map(prev);
      next.set(item.id, (next.get(item.id) || 0) + 1);
      return next;
    });

    if (nextSectionTitle) {
      setTimeout(() => {
        const headings = Array.from(document.querySelectorAll('h2, h3'));
        const target = headings.find(
          (h) => h.textContent?.trim().toLowerCase() === nextSectionTitle?.toLowerCase()
        );
        if (target) {
          smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - 20, 750);
        }
      }, 200);
    }
  };

  const handleRemoveExtra = (itemId: string) => {
    setSelectedExtras((prev) => {
      const next = new Map(prev);
      const current = next.get(itemId) || 0;
      if (current <= 1) {
        next.delete(itemId);
      } else {
        next.set(itemId, current - 1);
      }
      return next;
    });
  };

  // Build the list of selected extra objects
  const getSelectedExtrasList = (): ExtraOption[] => {
    const list: ExtraOption[] = [];
    const all = [...coberturas, ...frutas, ...complementos, ...turbines];
    selectedExtras.forEach((qty, id) => {
      const item = all.find((x) => x.id === id);
      if (item) {
        for (let i = 0; i < qty; i++) {
          list.push(item);
        }
      }
    });
    return list;
  };

  const extrasTotalPrice = getSelectedExtrasList().reduce((sum, e) => sum + e.price, 0);
  const totalItemPrice = (product.price + extrasTotalPrice) * quantity;

  const handleSaveToCart = () => {
    const chosenExtras = getSelectedExtrasList();
    if (isEditing && editItem) {
      updateItem(editItem.cartItemId, quantity, chosenExtras, observation);
      navigate('/sacola');
    } else {
      addItem(product, chosenExtras, quantity, observation);
      if (navState?.from === 'sacola') {
        navigate('/sacola');
      } else {
        navigate('/');
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        });
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] max-w-[640px] mx-auto pb-32">
      {/* Product Hero Image */}
      <div className="relative">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-[240px] object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-3">
          <button
            onClick={() => navigate(navState?.from === 'sacola' ? '/sacola' : '/')}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </button>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-gray-900" />
          </button>
        </div>
      </div>

      <main className="space-y-0">
        {/* Product Information */}
        <div className="bg-white px-4 py-4 -mt-4 rounded-t-2xl relative z-10">
          <h1 className="text-[18px] font-bold text-gray-900 leading-snug">
            {product.title}
          </h1>
          <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-baseline gap-2.5 mt-3">
            <span className="text-[20px] font-bold text-gray-900">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[14px] text-gray-400 line-through">
              R$ {product.oldPrice.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] font-bold text-[#16a34a] bg-green-50 px-2 py-0.5 rounded">
              -{product.discount}%
            </span>
          </div>
        </div>

        {/* 1. Coberturas (Max 2) */}
        <div className="bg-white mt-2">
          <div className="bg-[#f5f5f5] px-4 py-3.5 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-gray-900">Coberturas</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Escolha até {MAX_COB} opções
              </p>
            </div>
            {countCob === MAX_COB ? (
              <div className="w-7 h-7 rounded-full bg-[#16a34a] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            ) : (
              <span className="text-[12px] font-bold px-2.5 py-1 rounded bg-gray-200 text-gray-700">
                {countCob}/{MAX_COB}
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {coberturas.map((item) => {
              const qty = selectedExtras.get(item.id) || 0;
              const disabledAdd = countCob >= MAX_COB;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3.5"
                >
                  <div>
                    <p className="text-[14px] font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-[12px] text-emerald-600 font-medium mt-0.5">
                      Grátis
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {qty > 0 && (
                      <>
                        <button
                          onClick={() => handleRemoveExtra(item.id)}
                          className="w-8 h-8 rounded-full border border-[#ea1d2c] flex items-center justify-center text-[#ea1d2c] active:scale-90 transition-transform cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[14px] font-bold text-gray-900 w-5 text-center">
                          {qty}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => handleAddExtra(item)}
                      disabled={disabledAdd}
                      className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer ${
                        disabledAdd
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#ea1d2c] text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Frutas (Max 2) */}
        <div className="bg-white mt-2">
          <div className="bg-[#f5f5f5] px-4 py-3.5 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-gray-900">Frutas</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Escolha até {MAX_FRUTA} opções
              </p>
            </div>
            {countFruta === MAX_FRUTA ? (
              <div className="w-7 h-7 rounded-full bg-[#16a34a] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            ) : (
              <span className="text-[12px] font-bold px-2.5 py-1 rounded bg-gray-200 text-gray-700">
                {countFruta}/{MAX_FRUTA}
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {frutas.map((item) => {
              const qty = selectedExtras.get(item.id) || 0;
              const disabledAdd = countFruta >= MAX_FRUTA;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3.5"
                >
                  <div>
                    <p className="text-[14px] font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-[12px] text-emerald-600 font-medium mt-0.5">
                      Grátis
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {qty > 0 && (
                      <>
                        <button
                          onClick={() => handleRemoveExtra(item.id)}
                          className="w-8 h-8 rounded-full border border-[#ea1d2c] flex items-center justify-center text-[#ea1d2c] active:scale-90 transition-transform cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[14px] font-bold text-gray-900 w-5 text-center">
                          {qty}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => handleAddExtra(item)}
                      disabled={disabledAdd}
                      className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer ${
                        disabledAdd
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#ea1d2c] text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Complementos (Max 4) */}
        <div className="bg-white mt-2">
          <div className="bg-[#f5f5f5] px-4 py-3.5 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-gray-900">Complementos</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Escolha até {MAX_COMP} opções
              </p>
            </div>
            {countComp === MAX_COMP ? (
              <div className="w-7 h-7 rounded-full bg-[#16a34a] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            ) : (
              <span className="text-[12px] font-bold px-2.5 py-1 rounded bg-gray-200 text-gray-700">
                {countComp}/{MAX_COMP}
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {complementos.map((item) => {
              const qty = selectedExtras.get(item.id) || 0;
              const disabledAdd = countComp >= MAX_COMP;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3.5"
                >
                  <div>
                    <p className="text-[14px] font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-[12px] text-emerald-600 font-medium mt-0.5">
                      Grátis
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {qty > 0 && (
                      <>
                        <button
                          onClick={() => handleRemoveExtra(item.id)}
                          className="w-8 h-8 rounded-full border border-[#ea1d2c] flex items-center justify-center text-[#ea1d2c] active:scale-90 transition-transform cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[14px] font-bold text-gray-900 w-5 text-center">
                          {qty}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => handleAddExtra(item)}
                      disabled={disabledAdd}
                      className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer ${
                        disabledAdd
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#ea1d2c] text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Turbine seu açaí (Max 1) */}
        <div className="bg-white mt-2">
          <div className="bg-[#f5f5f5] px-4 py-3.5 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-gray-900">Turbine seu açaí</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Escolha até {MAX_TURB} opção especial
              </p>
            </div>
            {countTurb === MAX_TURB ? (
              <div className="w-7 h-7 rounded-full bg-[#16a34a] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            ) : (
              <span className="text-[12px] font-bold px-2.5 py-1 rounded bg-gray-200 text-gray-700">
                {countTurb}/{MAX_TURB}
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {turbines.map((item) => {
              const qty = selectedExtras.get(item.id) || 0;
              const disabledAdd = countTurb >= MAX_TURB;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3.5"
                >
                  <div>
                    <p className="text-[14px] font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-[12px] text-emerald-600 font-medium mt-0.5">
                      Grátis
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {qty > 0 && (
                      <>
                        <button
                          onClick={() => handleRemoveExtra(item.id)}
                          className="w-8 h-8 rounded-full border border-[#ea1d2c] flex items-center justify-center text-[#ea1d2c] active:scale-90 transition-transform cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[14px] font-bold text-gray-900 w-5 text-center">
                          {qty}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => handleAddExtra(item)}
                      disabled={disabledAdd}
                      className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer ${
                        disabledAdd
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#ea1d2c] text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Observation Input */}
        <div className="bg-white mt-2 p-4">
          <h2 className="text-[15px] font-bold text-gray-900 mb-2">
            Alguma observação?
          </h2>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Ex: sem banana, granola separada, etc."
            maxLength={140}
            rows={3}
            className="w-full p-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ea1d2c] resize-none"
          />
          <div className="text-right text-[11px] text-gray-400 mt-1">
            {observation.length}/140
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[640px] mx-auto bg-white border-t border-gray-100 p-4 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Quantity selector */}
          <div className="flex items-center border border-gray-200 rounded-xl h-12 px-2 bg-gray-50 flex-shrink-0">
            <button
              onClick={() => setQuantity((q: number) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className={`w-8 h-8 flex items-center justify-center ${
                quantity <= 1 ? 'text-gray-300' : 'text-[#ea1d2c] cursor-pointer'
              }`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-[15px] text-gray-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q: number) => q + 1)}
              className="w-8 h-8 flex items-center justify-center text-[#ea1d2c] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleSaveToCart}
            className="flex-1 bg-[#ea1d2c] hover:bg-[#d41825] text-white font-bold h-12 rounded-xl text-[15px] flex items-center justify-between px-5 shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <span>{isEditing ? 'Salvar alterações' : 'Adicionar à sacola'}</span>
            <span>R$ {totalItemPrice.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
