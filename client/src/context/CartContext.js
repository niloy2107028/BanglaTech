import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "../api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    // Only fetch cart for buyers. Guests, Admins, and Sellers don't have carts.
    if (!user || user.role !== "buyer") {
      setCart({ items: [] });
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("/api/cart", { withCredentials: true });
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      alert("Please login to add items to cart");
      return;
    }

    if (user.role !== "buyer") {
      alert("Only buyers can add items to the cart.");
      return;
    }

    try {
      const res = await axios.post(
        "/api/cart",
        { productId, quantity },
        { withCredentials: true }
      );
      if (res.data.success) {
        setCart(res.data.data);
        return true;
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error adding to cart");
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await axios.put(
        `/api/cart/${productId}`,
        { quantity },
        { withCredentials: true }
      );
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error updating quantity");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await axios.delete(`/api/cart/${productId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error removing item");
    }
  };

  const clearCart = async () => {
    try {
      const res = await axios.delete("/api/cart", { withCredentials: true });
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const cartItemsCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotalPrice = cart.items.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartItemsCount,
        cartTotalPrice,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
