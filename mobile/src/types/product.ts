export interface Product {
  _id: string;
  name: string;
  brand: string;
  category?: string;
  categoryName?: string;
  seller?: string;
  image?: string;
  price: number;
  originalPrice?: number;
  description?: string;
  specifications?: Record<string, string>;
  stock: number;
  inStock?: boolean;
  featured?: boolean;
  rating?: number;
  reviews?: number;
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  count?: number;
  total?: number;
}
