
export interface ThemeProps {
  isNight: boolean;
  toggleTheme: () => void;
}

export interface Ingredient {
  symbol: string;
  name: string;
  number: number;
  benefit: string;
  category: 'hydration' | 'barrier' | 'detox' | 'active';
}

export interface BlogPost {
  id: number;
  title: string;
  category: string;
  image: string;
  body_html?: string;
  summary_html?: string;
  author?: string;
  published_at?: string;
  blog_title?: string;
}

export type ProductMode = 'hydration' | 'protection' | 'balance' | 'wash' | 'mask';

export interface CartItem {
  id: string; // Internal ID (mesa/crest)
  variantId: number; // Shopify Variant ID
  name: string;
  price: number;
  quantity: number;
  color: string;
}

export interface Product {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  variants: ProductVariant[];
  images: ProductImage[];
  product_type: string;
}

export interface ProductImage {
  id: number;
  src: string;
  alt: string;
}

export interface ProductVariant {
  id: number;
  price: string;
  title: string;
}
