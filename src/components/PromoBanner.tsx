import React from 'react';

export const PromoBanner: React.FC = () => {
  return (
    <div className="mx-4 -mt-5 mb-4 relative z-10">
      <div
        className="rounded-[24px] sm:rounded-3xl bg-white p-4 sm:p-5 flex items-center gap-3.5 border border-gray-100/90 shadow-sm"
        style={{ boxShadow: '0 4px 18px rgba(0, 0, 0, 0.06)' }}
      >
        {/* Official circular iFood smile badge */}
        <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden shadow-xs">
          <svg
            viewBox="0 0 38 38"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="19" cy="19" r="19" fill="#EA1D2C" />
            <g transform="translate(7, 7)">
              <path
                fill="#FFFFFF"
                d="M8.428 1.67c-4.65 0-7.184 4.149-7.184 6.998 0 2.294 2.2 3.299 4.25 3.299l-.006-.006c4.244 0 7.184-3.854 7.184-6.998 0-2.29-2.175-3.293-4.244-3.293zm11.328 0c-4.65 0-7.184 4.149-7.184 6.998 0 2.294 2.2 3.299 4.25 3.299l-.006-.006C21.061 11.96 24 8.107 24 4.963c0-2.29-2.18-3.293-4.244-3.293zM14.172 14.52l2.435 1.834c-2.17 2.07-6.124 3.525-9.353 3.17A8.913 8.913 0 01.23 14.541H0a9.598 9.598 0 008.828 7.758c3.814.24 7.323-.905 9.947-3.13l-.004.007 1.08 2.988 1.555-7.623-7.234-.02Z"
              />
            </g>
          </svg>
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-black italic tracking-wide text-[#EA1D2C] uppercase leading-none">
            PARCEIRO OFICIAL IFOOD
          </p>
          <h3 className="text-[15px] sm:text-[16px] font-bold text-gray-900 leading-snug mt-1">
            Promoção de primeiro pedido ativa!
          </h3>
          <p className="text-[13px] text-gray-500 leading-snug mt-1">
            Descontos já aplicados em todos os combos para você estrear no Sabor Do Açaí.
          </p>
        </div>
      </div>
    </div>
  );
};
