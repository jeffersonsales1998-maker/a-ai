import React, { useState } from 'react';
import {
  ChevronLeft,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  Sparkles,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { allProducts } from '../data/products';
import { Product } from '../types';

export const CartPage: React.FC = () => {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart,
    navigate,
    addItem,
  } = useApp();

  const [pecaCategory, setPecaCategory] = useState<string>('todos');
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);

  // Original price without discount to show discount savings
  const originalSubtotal = items.reduce((sum, item) => {
    const extrasTotal = item.extras.reduce((eSum, ext) => eSum + ext.price, 0);
    return sum + (item.product.oldPrice + extrasTotal) * item.quantity;
  }, 0);

  const discountAmount = Math.max(0, originalSubtotal - totalPrice);

  // Filter other products for "Peça também"
  const cartProductIds = new Set(items.map((i) => i.product.id));

  // Sort: show items not yet in cart first, followed by others
  const otherProducts = allProducts.filter((product) => {
    if (pecaCategory === 'todos') return true;
    if (pecaCategory === 'combos') return product.category === 'pague1leve2';
    if (pecaCategory === 'zero')
      return (
        product.category === 'pague1leve2zero' ||
        product.category === 'acai-zero-individual'
      );
    if (pecaCategory === 'individuais')
      return (
        product.category === 'acai-individual' ||
        product.category === 'acai-zero-individual'
      );
    return true;
  });

  const handleProductClick = (product: Product) => {
    navigate(`/produto/${product.id}`, { from: 'sacola' });
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    // Navigate to product customization so user can select their 9 free complementos
    navigate(`/produto/${product.id}`, { from: 'sacola' });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] max-w-[640px] mx-auto flex flex-col font-sans antialiased text-[#1f2937]">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-[56px] px-4">
            <button
              onClick={() => navigate('/')}
              aria-label="Voltar"
              className="w-10 h-10 flex items-center justify-center text-gray-800 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2]" />
            </button>
            <h1 className="text-[16px] font-bold text-gray-900 tracking-wide">
              SACOLA
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-10">
          <div className="w-[120px] h-[120px] mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingBag className="w-14 h-14 text-gray-400 stroke-[1.5]" />
          </div>
          <p className="text-[18px] font-bold text-gray-900 leading-snug">
            Sua sacola está vazia
          </p>
          <p className="text-[14px] text-gray-500 mt-2 max-w-[260px] leading-relaxed">
            Adicione itens para fazer seu pedido
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-8 bg-[#ea1d2c] hover:bg-[#d41825] text-white rounded-xl w-full max-w-[280px] h-[48px] text-[15px] font-semibold active:scale-98 transition-transform shadow-md cursor-pointer"
          >
            Ver cardápio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] max-w-[640px] mx-auto pb-28 font-sans antialiased text-[#1f2937]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-[56px] px-4">
          <button
            onClick={() => navigate('/')}
            aria-label="Voltar ao cardápio"
            className="w-10 h-10 flex items-center justify-center -ml-2 text-gray-800 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2]" />
          </button>
          <h1 className="text-[16px] font-bold text-gray-900 tracking-wide">
            SACOLA
          </h1>
          <button
            onClick={clearCart}
            className="text-[14px] text-[#ea1d2c] font-semibold cursor-pointer hover:opacity-80 transition-opacity"
          >
            Limpar
          </button>
        </div>
      </header>

      <main className="pt-3 space-y-2">
        {/* Store mini banner */}
        <div className="bg-white px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <img
              src="/logo-sabor-acai.jpg"
              alt="Logo"
              className="w-[48px] h-[48px] rounded-[12px] object-cover border border-gray-100 shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-[15px] font-bold text-gray-900">
                Sabor Do Açaí
              </p>
              <button
                onClick={() => navigate('/')}
                className="text-[13px] text-[#ea1d2c] font-semibold cursor-pointer hover:underline"
              >
                Adicionar mais itens
              </button>
            </div>
          </div>
        </div>

        {/* Itens adicionados */}
        <div className="bg-white px-4 py-4">
          <h2 className="text-[15px] font-bold text-gray-900 mb-3">
            Itens adicionados
          </h2>
          <div className="space-y-0 divide-y divide-gray-100">
            {items.map((item) => {
              const extrasTotal = item.extras.reduce((s, e) => s + e.price, 0);
              const itemTotal = (item.product.price + extrasTotal) * item.quantity;

              return (
                <div
                  key={item.cartItemId}
                  className="flex gap-3 py-3.5 first:pt-0 cursor-pointer"
                  onClick={() =>
                    navigate(`/produto/${item.product.id}`, {
                      from: 'sacola',
                      editItem: item,
                    })
                  }
                >
                  {/* Item Image with edit badge */}
                  <div className="relative w-[72px] h-[72px] rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#ea1d2c] flex items-center justify-center shadow-xs">
                      <span className="text-[10px] text-white">✎</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-2">
                          {item.product.title}
                        </p>
                        {item.product.shortDescription && (
                          <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">
                            {item.product.shortDescription}
                          </p>
                        )}
                        {item.extras.length > 0 && (
                          <div className="mt-1">
                            {item.extras.map((ext, idx) => (
                              <p
                                key={idx}
                                className="text-[11px] text-gray-500 line-clamp-1"
                              >
                                + {ext.name}
                              </p>
                            ))}
                          </div>
                        )}
                        {item.observation && (
                          <p className="text-[11px] text-gray-500 italic mt-1 line-clamp-2">
                            <span className="font-medium text-gray-600">Obs:</span>{' '}
                            {item.observation}
                          </p>
                        )}
                        <p className="text-[14px] font-bold text-gray-900 mt-1.5">
                          R$ {itemTotal.toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      {/* Quantity stepper */}
                      <div
                        className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0 bg-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            if (item.quantity === 1) {
                              removeItem(item.cartItemId);
                            } else {
                              updateQuantity(item.cartItemId, item.quantity - 1);
                            }
                          }}
                          className="w-9 h-9 flex items-center justify-center text-[#ea1d2c] active:bg-gray-50 transition-colors cursor-pointer"
                          aria-label="Diminuir ou remover item"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="w-4 h-4 stroke-[1.8]" />
                          ) : (
                            <Minus className="w-4 h-4 stroke-[2]" />
                          )}
                        </button>
                        <span className="w-7 text-center text-[14px] font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.cartItemId, item.quantity + 1)
                          }
                          className="w-9 h-9 flex items-center justify-center text-[#ea1d2c] active:bg-gray-50 transition-colors cursor-pointer"
                          aria-label="Aumentar item"
                        >
                          <Plus className="w-4 h-4 stroke-[2]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full text-center text-[14px] text-[#ea1d2c] font-semibold py-2.5 mt-2 cursor-pointer hover:underline"
          >
            Adicionar mais itens
          </button>
        </div>

        {/* ============================================================== */}
        {/* ABA / CARROSSEL: Peça também (Adicione ao seu pedido)        */}
        {/* ============================================================== */}
        <div className="bg-white px-4 py-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-1.5">
                <span>Peça também</span>
              </h2>
              <p className="text-[12px] text-gray-500">
                Aproveite para adicionar outros itens ao seu pedido
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#ea1d2c] bg-red-50 px-2 py-0.5 rounded-full">
              50% OFF
            </span>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 pt-1 mb-2">
            <button
              onClick={() => setPecaCategory('todos')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                pecaCategory === 'todos'
                  ? 'bg-[#ea1d2c] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setPecaCategory('combos')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                pecaCategory === 'combos'
                  ? 'bg-[#ea1d2c] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Combos (Pague 1 Leve 2)
            </button>
            <button
              onClick={() => setPecaCategory('zero')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                pecaCategory === 'zero'
                  ? 'bg-[#ea1d2c] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Zero Açúcar
            </button>
            <button
              onClick={() => setPecaCategory('individuais')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                pecaCategory === 'individuais'
                  ? 'bg-[#ea1d2c] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Individuais
            </button>
          </div>

          {/* Horizontal Carousel */}
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 pt-1 -mx-4 px-4 snap-x snap-mandatory">
            {otherProducts.map((prod) => {
              const inCartCount = items
                .filter((i) => i.product.id === prod.id)
                .reduce((sum, i) => sum + i.quantity, 0);

              return (
                <div
                  key={prod.id}
                  onClick={() => handleProductClick(prod)}
                  className="w-[156px] min-w-[156px] sm:w-[168px] sm:min-w-[168px] bg-white border border-gray-200/90 rounded-2xl p-2.5 flex flex-col justify-between snap-start hover:shadow-md transition-all cursor-pointer group flex-shrink-0"
                >
                  <div>
                    {/* Product Image */}
                    <div className="relative w-full h-[105px] rounded-xl overflow-hidden bg-gray-50 mb-2">
                      <img
                        src={prod.image}
                        alt={prod.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-1.5 right-1.5 bg-[#ea1d2c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                        50% OFF
                      </span>
                      {inCartCount > 0 && (
                        <span className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                          {inCartCount} na sacola
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-2 min-h-[32px] group-hover:text-[#ea1d2c] transition-colors">
                      {prod.title}
                    </h3>

                    {/* Short Description */}
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                      {prod.shortDescription || '9 Complementos Grátis'}
                    </p>
                  </div>

                  {/* Price & Add button */}
                  <div className="mt-2.5 pt-2 border-t border-gray-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[14px] font-extrabold text-gray-900">
                        R$ {prod.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[11px] text-gray-400 line-through">
                        R$ {prod.oldPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleQuickAdd(e, prod)}
                      className="mt-2 w-full py-1.5 px-2 rounded-xl bg-[#ea1d2c] hover:bg-[#d41825] active:scale-95 text-white text-[12px] font-bold shadow-xs transition-transform flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cupons bloqueados */}
        <div className="bg-white px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Tag className="w-[18px] h-[18px] text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-gray-900 leading-snug">
                Cupons bloqueados
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Item já tem desconto de 50% aplicado
              </p>
            </div>
          </div>
        </div>

        {/* Resumo de valores */}
        <div className="bg-white px-4 py-4">
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
                <span className="text-[#16a34a] font-medium">
                  - R$ {discountAmount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-500">Taxa de entrega</span>
              <span className="text-[#16a34a] font-medium">Grátis</span>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-3" />

          <div className="flex justify-between items-center">
            <span className="text-[16px] font-bold text-gray-900">Total</span>
            <span className="text-[16px] font-bold text-gray-900">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[640px] mx-auto bg-white px-4 py-2.5 safe-area-bottom z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] text-gray-500">Total com a entrega</p>
            <p className="text-[16px] font-bold text-gray-900">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
              <span className="text-[12px] font-normal text-gray-500 ml-1">
                / {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </span>
            </p>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="bg-[#ea1d2c] hover:bg-[#d41825] text-white rounded-xl px-8 h-[48px] text-[15px] font-semibold active:scale-98 transition-transform cursor-pointer shadow-md"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
