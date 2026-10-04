import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigate, items } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const countInCart = items
    .filter((item) => item.product.id === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      onClick={() => navigate(`/produto/${product.id}`)}
      className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0 cursor-pointer active:bg-gray-50 transition-colors rounded-lg -mx-1 px-1 select-none"
    >
      <div className="flex flex-col gap-1 flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-medium text-gray-900 leading-snug">
            {product.title}
          </h3>
          {product.bestSeller && (
            <span className="text-[9px] font-bold text-[#ea1d2c] bg-red-50 px-1.5 py-0.5 rounded whitespace-nowrap">
              MAIS VENDIDO
            </span>
          )}
        </div>

        <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2">
          {product.shortDescription}
        </p>

        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-[14px] font-semibold text-gray-900">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[12px] text-gray-400 line-through">
            R$ {product.oldPrice.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[10px] font-bold text-[#16a34a] bg-green-50 px-1.5 py-0.5 rounded">
            -{product.discount}%
          </span>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden flex-shrink-0 w-[96px] h-[96px] bg-gray-100">
        <img
          src={product.cardImage || product.image}
          alt={product.title}
          className="w-full h-full object-cover"
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        {mounted && countInCart > 0 && (
          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#ea1d2c] flex items-center justify-center shadow">
            <span className="text-[10px] font-bold text-white">
              {countInCart}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
