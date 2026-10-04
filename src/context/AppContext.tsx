import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ExtraOption, CartItem, Address, PaymentMethod } from '../types';

interface AppContextType {
  // Cart
  items: CartItem[];
  addItem: (product: Product, extras: ExtraOption[], quantity: number, observation?: string) => void;
  updateItem: (cartItemId: string, quantity: number, extras?: ExtraOption[], observation?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // City & Location
  userCity: string;
  setUserCity: (city: string) => void;

  // Checkout info
  address: Address | null;
  setAddress: (addr: Address | null) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerCpf: string;
  setCustomerCpf: (cpf: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  appliedCoupon: string | null;
  setAppliedCoupon: (coupon: string | null) => void;

  // Navigation
  currentPath: string;
  navigate: (path: string, state?: any) => void;
  navState: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sabor_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userCity, setUserCityState] = useState<string>(() => {
    try {
      return localStorage.getItem('sabor_user_city') || '';
    } catch {
      return '';
    }
  });

  const [address, setAddressState] = useState<Address | null>(null);
  const [customerName, setCustomerNameState] = useState<string>('');
  const [customerPhone, setCustomerPhoneState] = useState<string>('');
  const [customerCpf, setCustomerCpfState] = useState<string>('');

  // Clear any residual mock/stored data on start so customer starts with blank form
  useEffect(() => {
    try {
      localStorage.removeItem('sabor_address');
      localStorage.removeItem('sabor_name');
      localStorage.removeItem('sabor_phone');
      localStorage.removeItem('sabor_cpf');
    } catch {}
  }, []);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Simple client-side routing based on window.location
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [navState, setNavState] = useState<any>(null);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      setCurrentPath(window.location.pathname || '/');
      setNavState(e.state);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string, state?: any) => {
    if (path === '-1') {
      window.history.back();
      return;
    }
    window.history.pushState(state, '', path);
    setCurrentPath(path.split('?')[0]);
    setNavState(state);
    window.scrollTo(0, 0);
  };

  const setUserCity = (city: string) => {
    setUserCityState(city);
    try {
      localStorage.setItem('sabor_user_city', city);
    } catch {}
  };

  const setAddress = (addr: Address | null) => {
    setAddressState(addr);
    try {
      if (addr) localStorage.setItem('sabor_address', JSON.stringify(addr));
      else localStorage.removeItem('sabor_address');
    } catch {}
  };

  const setCustomerName = (name: string) => {
    setCustomerNameState(name);
    try {
      localStorage.setItem('sabor_name', name);
    } catch {}
  };

  const setCustomerPhone = (phone: string) => {
    setCustomerPhoneState(phone);
    try {
      localStorage.setItem('sabor_phone', phone);
    } catch {}
  };

  const setCustomerCpf = (cpf: string) => {
    setCustomerCpfState(cpf);
    try {
      localStorage.setItem('sabor_cpf', cpf);
    } catch {}
  };

  useEffect(() => {
    try {
      localStorage.setItem('sabor_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (product: Product, extras: ExtraOption[], quantity: number, observation?: string) => {
    const cartItemId = `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newItem: CartItem = {
      cartItemId,
      product,
      quantity,
      extras,
      observation,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (cartItemId: string, quantity: number, extras?: ExtraOption[], observation?: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity,
            extras: extras !== undefined ? extras : item.extras,
            observation: observation !== undefined ? observation : item.observation,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
    } else {
      setItems((prev) =>
        prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item))
      );
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => {
    const extrasTotal = item.extras.reduce((eSum, ext) => eSum + ext.price, 0);
    return sum + (item.product.price + extrasTotal) * item.quantity;
  }, 0);

  return (
    <AppContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        userCity,
        setUserCity,
        address,
        setAddress,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        customerCpf,
        setCustomerCpf,
        paymentMethod,
        setPaymentMethod,
        appliedCoupon,
        setAppliedCoupon,
        currentPath,
        navigate,
        navState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
