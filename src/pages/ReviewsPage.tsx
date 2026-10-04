import React, { useState } from 'react';
import {
  ChevronLeft,
  Search,
  Share2,
  Heart,
  Star,
  Check,
  MessageSquare,
  Bookmark,
  ChevronDown,
  Flag,
  ThumbsUp,
  Store,
  Clock,
  MapPin,
  CreditCard,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { reviewsData } from '../data/products';
import { useApp } from '../context/AppContext';

export const ReviewsPage: React.FC = () => {
  const { navigate, userCity } = useApp();
  const [activeTab, setActiveTab] = useState<'reviews' | 'about'>('reviews');
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'highest'>('recent');
  const [helpfulCounts, setHelpfulCounts] = useState<Record<number, number>>({});
  const [likedReviews, setLikedReviews] = useState<Record<number, boolean>>({});
  const [isFavorited, setIsFavorited] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(false);

  const filteredReviews = reviewsData
    .filter((r) => {
      if (starFilter === 'all') return true;
      return r.stars === starFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return (a.daysAgo ?? 1) - (b.daysAgo ?? 1);
      }
      return b.stars - a.stars;
    });

  const toggleHelpful = (idx: number, baseCount: number) => {
    const isLiked = likedReviews[idx];
    setLikedReviews((prev) => ({ ...prev, [idx]: !isLiked }));
    setHelpfulCounts((prev) => ({
      ...prev,
      [idx]: (prev[idx] ?? baseCount) + (isLiked ? -1 : 1),
    }));
  };

  const handleShare = async (rev?: { name: string; body: string }) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sabor Do Açaí - Avaliação',
          text: rev ? `"${rev.body}" - Avaliação de ${rev.name}` : 'Confira o Sabor Do Açaí!',
          url: window.location.href,
        });
      } catch {
        // user cancelled or unsupported
      }
    } else {
      setShowShareNotification(true);
      setTimeout(() => setShowShareNotification(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-[500px] mx-auto pb-16 font-sans antialiased text-[#1f2937]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-[54px] px-4">
          <button
            onClick={() => navigate('/')}
            aria-label="Voltar"
            className="w-9 h-9 rounded-full border border-gray-200/80 flex items-center justify-center text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 stroke-[2]" />
          </button>

          <h1 className="text-[15px] font-bold text-gray-900 tracking-wide">
            SABOR DO AÇAI
          </h1>

          <div className="flex items-center gap-3.5">
            <button
              onClick={() => handleShare()}
              aria-label="Buscar"
              className="text-[#ea1d2c] hover:opacity-80 active:scale-95 transition-transform cursor-pointer"
            >
              <Search className="w-5 h-5 stroke-[2]" />
            </button>
            <button
              onClick={() => handleShare()}
              aria-label="Compartilhar"
              className="text-[#ea1d2c] hover:opacity-80 active:scale-95 transition-transform cursor-pointer"
            >
              <Share2 className="w-5 h-5 stroke-[2]" />
            </button>
            <button
              onClick={() => setIsFavorited((prev) => !prev)}
              aria-label="Favoritar"
              className={`text-[#ea1d2c] hover:opacity-80 active:scale-95 transition-transform cursor-pointer ${
                isFavorited ? 'fill-[#ea1d2c]' : ''
              }`}
            >
              <Heart
                className={`w-5 h-5 stroke-[2] ${
                  isFavorited ? 'fill-[#ea1d2c]' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-100 bg-white">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 text-center py-2.5 text-[15px] cursor-pointer transition-colors relative ${
              activeTab === 'reviews'
                ? 'font-semibold text-[#ea1d2c]'
                : 'text-gray-500 font-normal hover:text-gray-800'
            }`}
          >
            Avaliações
            {activeTab === 'reviews' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#ea1d2c] rounded-t-sm" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 text-center py-2.5 text-[15px] cursor-pointer transition-colors relative ${
              activeTab === 'about'
                ? 'font-semibold text-[#ea1d2c]'
                : 'text-gray-500 font-normal hover:text-gray-800'
            }`}
          >
            Informações
            {activeTab === 'about' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#ea1d2c] rounded-t-sm" />
            )}
          </button>
        </div>
      </header>

      {/* Share Toast */}
      {showShareNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-[13px] px-4 py-2 rounded-full shadow-lg transition-opacity">
          Link da avaliação copiado!
        </div>
      )}

      {activeTab === 'reviews' && (
        <main className="bg-white">
          {/* Filter Pills Row */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setStarFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                starFilter === 'all'
                  ? 'border border-[#ea1d2c] text-[#ea1d2c] bg-white'
                  : 'bg-[#f2f4f7] text-gray-700 hover:bg-gray-200 border border-transparent'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStarFilter(5)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                starFilter === 5
                  ? 'border border-[#ea1d2c] text-[#ea1d2c] bg-white'
                  : 'bg-[#f2f4f7] text-gray-700 hover:bg-gray-200 border border-transparent'
              }`}
            >
              5★
            </button>
            <button
              onClick={() => setStarFilter(4)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                starFilter === 4
                  ? 'border border-[#ea1d2c] text-[#ea1d2c] bg-white'
                  : 'bg-[#f2f4f7] text-gray-700 hover:bg-gray-200 border border-transparent'
              }`}
            >
              4★
            </button>
            <button
              onClick={() => setStarFilter(3)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                starFilter === 3
                  ? 'border border-[#ea1d2c] text-[#ea1d2c] bg-white'
                  : 'bg-[#f2f4f7] text-gray-700 hover:bg-gray-200 border border-transparent'
              }`}
            >
              3★
            </button>
            <button
              onClick={() =>
                setSortBy((prev) => (prev === 'recent' ? 'highest' : 'recent'))
              }
              className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#f2f4f7] text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 border border-transparent ml-auto"
            >
              <span>{sortBy === 'recent' ? 'Recentes' : 'Melhores'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-600 stroke-[2]" />
            </button>
          </div>

          {/* Super Quality Card */}
          <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-200/90 p-4 pb-5 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#ea1d2c] flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                </div>
                <span className="text-[17px] font-bold text-gray-900">Super</span>
              </div>

              <div className="text-right">
                <div className="text-[26px] font-bold text-gray-900 leading-none">
                  4.9<span className="text-[14px] font-normal text-gray-400">/5</span>
                </div>
                <div className="flex items-center gap-0.5 mt-1 justify-end">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-[#ea1d2c] text-[#ea1d2c]"
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[13px] text-gray-800 mt-2.5 leading-snug">
              Com base nos pedidos dos últimos 3 meses,{' '}
              <strong className="font-bold text-gray-900">
                a loja está entre as melhores do delivery
              </strong>
            </p>

            <div className="w-full h-px bg-gray-100 my-4" />

            {/* 3 Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <Star className="w-6 h-6 text-gray-800 stroke-[1.6]" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-white">
                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </div>
                </div>
                <span className="text-[11px] text-gray-600 leading-tight">
                  Avaliações excelentes
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <MessageSquare className="w-6 h-6 text-gray-800 stroke-[1.6]" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-white">
                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </div>
                </div>
                <span className="text-[11px] text-gray-600 leading-tight">
                  Zero ou poucas reclamações
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <Bookmark className="w-6 h-6 text-gray-800 stroke-[1.6]" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-white">
                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </div>
                </div>
                <span className="text-[11px] text-gray-600 leading-tight">
                  Zero ou poucos cancelamentos
                </span>
              </div>
            </div>

            {/* Center Red Down Chevron */}
            <div className="flex justify-center -mb-8 mt-4">
              <div className="w-6 h-6 rounded-full bg-[#ea1d2c] flex items-center justify-center text-white shadow-xs">
                <ChevronDown className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Heading: Veja o que os clientes dizem */}
          <div className="text-center mt-7 mb-4 px-4">
            <h2 className="text-[15px] font-bold text-gray-900">
              Veja o que os clientes dizem
            </h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              2.136 avaliações reais e verificadas
            </p>
          </div>

          {/* Overall Rating & Breakdown */}
          <div className="px-4 py-3 flex items-center gap-6">
            {/* Left Big Score */}
            <div className="flex flex-col items-center justify-center min-w-[90px]">
              <span className="text-[38px] font-bold text-gray-900 leading-none tracking-tight">
                4.9
              </span>
              <div className="flex items-center gap-0.5 mt-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3 h-3 fill-[#ea1d2c] text-[#ea1d2c]"
                  />
                ))}
              </div>
              <span className="text-[11px] text-gray-500 mt-1">
                2136 avaliações
              </span>
            </div>

            {/* Right Distribution Bars */}
            <div className="flex-1 space-y-1 text-[11px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2 text-right">5</span>
                <Star className="w-2.5 h-2.5 fill-[#ea1d2c] text-[#ea1d2c]" />
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ea1d2c] rounded-full w-[94%]" />
                </div>
                <span className="w-8 text-right font-medium text-gray-600">
                  2004
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 text-right">4</span>
                <Star className="w-2.5 h-2.5 fill-[#ea1d2c] text-[#ea1d2c]" />
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ea1d2c] rounded-full w-[5%]" />
                </div>
                <span className="w-8 text-right font-medium text-gray-600">
                  105
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 text-right">3</span>
                <Star className="w-2.5 h-2.5 fill-[#ea1d2c] text-[#ea1d2c]" />
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ea1d2c] rounded-full w-[1%]" />
                </div>
                <span className="w-8 text-right font-medium text-gray-600">
                  17
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 text-right">2</span>
                <Star className="w-2.5 h-2.5 fill-[#ea1d2c] text-[#ea1d2c]" />
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ea1d2c] rounded-full w-[0.5%]" />
                </div>
                <span className="w-8 text-right font-medium text-gray-600">
                  6
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 text-right">1</span>
                <Star className="w-2.5 h-2.5 fill-[#ea1d2c] text-[#ea1d2c]" />
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ea1d2c] rounded-full w-[0.3%]" />
                </div>
                <span className="w-8 text-right font-medium text-gray-600">
                  4
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 my-2" />

          {/* Customer Reviews List */}
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((rev, idx) => {
              const currentHelpful = helpfulCounts[idx] ?? rev.helpful ?? 3;
              const isLiked = likedReviews[idx];

              return (
                <div key={idx} className="p-4 space-y-2">
                  {/* Top user row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#fee2e2] text-[#ea1d2c] font-bold text-[14px] flex items-center justify-center flex-shrink-0">
                        {rev.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-gray-900 leading-snug">
                          {rev.name}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            {[...Array(rev.stars)].map((_, s) => (
                              <Star
                                key={s}
                                className="w-3 h-3 fill-[#ea1d2c] text-[#ea1d2c]"
                              />
                            ))}
                          </div>
                          <span className="text-[12px] text-gray-500 ml-1">
                            {rev.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      aria-label="Denunciar avaliação"
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <Flag className="w-4 h-4 stroke-[1.5]" />
                    </button>
                  </div>

                  {/* Comment text */}
                  <p className="text-[13px] text-gray-800 leading-snug pt-1">
                    {rev.body}
                  </p>

                  {/* Store Reply */}
                  {rev.reply && (
                    <div className="bg-[#f4f5f7] rounded-2xl p-3.5 mt-2.5">
                      <p className="text-[13px] font-bold text-gray-900 mb-0.5">
                        Resposta da loja
                      </p>
                      <p className="text-[13px] text-gray-700 leading-snug">
                        {rev.reply}
                      </p>
                    </div>
                  )}

                  {/* Actions: Útil & Compartilhar */}
                  <div className="flex items-center gap-5 pt-2 text-[12px]">
                    <button
                      onClick={() => toggleHelpful(idx, rev.helpful ?? 3)}
                      className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isLiked
                          ? 'text-[#ea1d2c] font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ThumbsUp
                        className={`w-3.5 h-3.5 stroke-[1.6] ${
                          isLiked ? 'fill-[#ea1d2c]' : ''
                        }`}
                      />
                      <span>Útil ({currentHelpful})</span>
                    </button>

                    <button
                      onClick={() => handleShare(rev)}
                      className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 stroke-[1.6]" />
                      <span>Compartilhar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* About/Informações Tab */}
      {activeTab === 'about' && (
        <main className="p-4 space-y-3 bg-[#f5f5f5] min-h-[calc(100vh-120px)]">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo-sabor-acai.jpg"
                alt="Logo"
                className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-[17px] font-bold text-gray-900">
                  Sabor Do Açaí
                </h3>
                <p className="text-[13px] text-gray-500">
                  O açaí mais recheado e amado da região!
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-100 text-[13px]">
              <div className="flex items-start gap-3 text-gray-700">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-900 block">
                    Horário de funcionamento
                  </span>
                  <span>Todos os dias das 12:00 às 23:30</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-900 block">
                    Endereço
                  </span>
                  <span>Centro - {userCity || 'Sua Região'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-700">
                <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-900 block">
                    Formas de pagamento
                  </span>
                  <span>Pix com aprovação imediata</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-900 block">
                    Selo de Qualidade iFood
                  </span>
                  <span className="text-emerald-700 font-medium">
                    Super Restaurante Verificado • Top 1% do delivery
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};
