export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface OrderItem {
  name: string;
  qty: number;
  image: string;
  price: number;
  product: string;
  seller?: string;
  sellerName?: string;
  status: OrderStatus;
  cancellationReason?: string;
}

export interface ShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

export interface Order {
  _id: string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderListResponse {
  success: boolean;
  data: Order[];
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  data: Order;
}

export interface CreateOrderPayload {
  orderItems: Array<{
    name: string;
    qty: number;
    image: string;
    price: number;
    product: string;
  }>;
  shippingAddress: ShippingAddress;
  totalPrice: number;
}
