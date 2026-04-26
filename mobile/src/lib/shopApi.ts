import { api } from "./api";
import { CartResponse } from "../types/cart";
import {
  CreateOrderPayload,
  OrderListResponse,
  OrderResponse,
} from "../types/order";

export async function getCart() {
  const { data } = await api.get<CartResponse>("/api/cart");
  return data.data;
}

export async function addToCart(productId: string, quantity = 1) {
  const { data } = await api.post<CartResponse>("/api/cart", { productId, quantity });
  return data.data;
}

export async function updateCartItem(productId: string, quantity: number) {
  const { data } = await api.put<CartResponse>(`/api/cart/${productId}`, { quantity });
  return data.data;
}

export async function removeFromCart(productId: string) {
  const { data } = await api.delete<CartResponse>(`/api/cart/${productId}`);
  return data.data;
}

export async function clearCart() {
  const { data } = await api.delete<CartResponse>("/api/cart");
  return data.data;
}

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await api.post<OrderResponse>("/api/orders", payload);
  return data.data;
}

export async function getMyOrders() {
  const { data } = await api.get<OrderListResponse>("/api/orders/myorders");
  return data.data;
}

export async function cancelOrderItem(orderId: string, productId: string, reason: string) {
  const { data } = await api.put<OrderResponse>(`/api/orders/${orderId}/item/${productId}/cancel`, {
    reason,
  });
  return data.data;
}
