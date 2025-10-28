// Shared types for the application

export interface SizeVariant {
  id: string;
  name: string;
  price: number;
  stockCount: number;
  images: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  inStock: boolean;
  isFeatured: boolean;
  sizeVariants: SizeVariant[];
  // Legacy fields for backward compatibility
  price?: number;
  salePrice?: number;
  discountPercent?: number;
  images?: string[];
  imageUrl?: string;
  stockCount?: number;
  sizes?: string[];
  courierCharges?: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  selectedVariantId: string;
  variantName: string;
  price: number;
  image: string;
  stockCount: number;
  quantity: number;
}
