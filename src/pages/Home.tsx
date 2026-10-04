import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { PromoBanner } from '../components/PromoBanner';
import { ProductCard } from '../components/ProductCard';
import { CartFloatingBar } from '../components/CartFloatingBar';
import { LocationPopup } from '../components/LocationPopup';
import { categoriesMeta, categorySections } from '../data/products';
import { useApp } from '../context/AppContext';

export const Home: React.FC = () => {
  const { userCity, setUserCity } = useApp();
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('pague1leve2');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (!userCity) {
      setShowLocationPopup(true);
    }
  }, [userCity]);

  const scrollToCategory = (catId: string) => {
    const el = sectionRefs.current[catId];
    if (!el) return;

    isScrollingRef.current = true;
    setActiveCategory(catId);

    const top = el.getBoundingClientRect().top + window.scrollY - 50;
    window.scrollTo({ top, behavior: 'smooth' });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 600);
  };

  const rafRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (isScrollingRef.current || rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      let current = 'pague1leve2';
      for (const cat of categoriesMeta) {
        const el = sectionRefs.current[cat.id];
        if (el && el.getBoundingClientRect().top <= 70) {
          current = cat.id;
        }
      }
      setActiveCategory((prev) => (prev === current ? prev : current));
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('handleScroll', handleScroll as any);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] max-w-[640px] mx-auto">
      <div className="bg-white">
        <Header />
        <PromoBanner />
      </div>

      <main className="pb-28">
        {/* Sticky category navigation */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 -mt-px shadow-xs">
          <div className="flex gap-0 px-4 overflow-x-auto scrollbar-none">
            {categoriesMeta.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`py-3.5 px-4 text-[14px] font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? 'border-[#ea1d2c] text-[#ea1d2c] font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Sections */}
        {categoriesMeta.map((cat) => {
          const section = categorySections[cat.id as keyof typeof categorySections];
          return (
            <div
              key={cat.id}
              ref={(el) => {
                sectionRefs.current[cat.id] = el;
              }}
              className="bg-white mt-2 first:mt-0"
            >
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-[16px] font-bold text-gray-900">
                  {section.title}
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {section.subtitle}
                </p>
              </div>

              <div className="px-4 pb-4 flex flex-col gap-4">
                {section.products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          );
        })}
      </main>

      <CartFloatingBar />

      {showLocationPopup && (
        <LocationPopup
          onClose={() => {
            setShowLocationPopup(false);
            if (!userCity) setUserCity('São Paulo');
          }}
        />
      )}
    </div>
  );
};
