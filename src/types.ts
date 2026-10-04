export interface Product {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  oldPrice: number;
  discount: number;
  image: string;
  cardImage?: string;
  stock?: number;
  stockLabel?: string;
  bestSeller?: boolean;
  category: 'pague1leve2' | 'pague1leve2zero' | 'acai-individual' | 'acai-zero-individual';
}

export type ExtraCategory = 'cobertura' | 'fruta' | 'complemento' | 'turbine';

export interface ExtraOption {
  id: string;
  name: string;
  price: number;
  category: ExtraCategory;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  extras: ExtraOption[];
  observation?: string;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Review {
  id?: string;
  name: string;
  stars: number;
  time: string;
  body: string;
  reply?: string;
  daysAgo?: number;
  helpful?: number;
}

export type PaymentMethod = 'pix' | 'card' | 'cash';
