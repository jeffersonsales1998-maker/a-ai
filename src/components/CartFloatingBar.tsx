import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const CartFloatingBar: React.FC = () => {
  const { totalItems, totalPrice, navigate } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[640px] mx-auto">
      <div
        style={{
          background: '#fff',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        <div className="px-4 pt-3 pb-2">
          <div
            style={{
              background: '#F2F2F2',
              borderRadius: 20,
              padding: '10px 14px 10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#50A773',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                %
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 13,
                  color: '#3E3E3E',
                  fontWeight: 500,
                  lineHeight: '18px',
                  margin: 0,
                }}
              >
                Você ganhou <span style={{ color: '#50A773', fontWeight: 700 }}>entrega grátis</span>!
              </p>
              <div
                style={{
                  marginTop: 6,
                  height: 4,
                  borderRadius: 2,
                  background: '#DCDCDC',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 2,
                    background: '#50A773',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-1 flex items-center justify-between">
          <div>
            <p
              style={{
                fontSize: 13,
                color: '#717171',
                fontWeight: 400,
                lineHeight: '16px',
                margin: 0,
              }}
            >
              Total com entrega grátis
            </p>
            <p style={{ margin: 0, lineHeight: '28px' }}>
              <span style={{ fontSize: 22, color: '#3E3E3E', fontWeight: 700 }}>
                R$ {totalPrice.toFixed(2).replace('.', ',')}
              </span>
              <span style={{ fontSize: 14, color: '#717171', fontWeight: 400 }}>
                {' '}/ {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </span>
            </p>
          </div>

          <button
            onClick={() => navigate('/sacola')}
            className="active:brightness-90 transition-all cursor-pointer"
            style={{
              backgroundColor: '#EA1D2C',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              borderRadius: 10,
              border: 'none',
              padding: '14px 32px',
              cursor: 'pointer',
              lineHeight: '20px',
              whiteSpace: 'nowrap',
            }}
          >
            Ver sacola
          </button>
        </div>
      </div>
    </div>
  );
};
