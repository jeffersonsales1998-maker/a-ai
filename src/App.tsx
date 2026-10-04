import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { CartPage } from './pages/CartPage';
import { AddressPage } from './pages/AddressPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TrackingPage } from './pages/TrackingPage';
import { ReviewsPage } from './pages/ReviewsPage';

const AppContent: React.FC = () => {
  const { currentPath } = useApp();

  // Route matching
  if (currentPath.startsWith('/produto/')) {
    const id = currentPath.replace('/produto/', '').split('?')[0];
    return <ProductDetail productId={id} />;
  }

  if (currentPath === '/sacola') {
    return <CartPage />;
  }

  if (
    currentPath === '/endereco' ||
    currentPath === '/checkout' ||
    currentPath === '/finalizar'
  ) {
    return <CheckoutPage />;
  }

  if (currentPath === '/rastreio') {
    return <TrackingPage />;
  }

  if (currentPath === '/avaliacoes') {
    return <ReviewsPage />;
  }

  return <Home />;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
