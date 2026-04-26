import { Product } from "./product";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  _id?: string;
  user?: string;
  items: CartItem[];
}

export interface CartResponse {
  success: boolean;
  message?: string;
  data: Cart;
}
