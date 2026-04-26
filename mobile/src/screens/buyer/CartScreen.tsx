import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { clearCart, getCart, removeFromCart, updateCartItem } from "../../lib/shopApi";
import { CartItem } from "../../types/cart";
import { AppNavProp } from "../../types/nav";

const P = "#fe424d";

function formatPrice(value: number) {
  return `৳ ${Number(value || 0).toLocaleString()}`;
}

export function CartScreen() {
  const navigation = useNavigation<AppNavProp>();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({ queryKey: ["cart"], queryFn: getCart });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateCartItem(productId, quantity),
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
    onError: () => Alert.alert("Error", "Failed to update quantity"),
  });

  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
    onError: () => Alert.alert("Error", "Failed to remove item"),
  });

  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
    onError: () => Alert.alert("Error", "Failed to clear cart"),
  });

  const items = data?.items || [];
  const totalPrice = items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);

  const onDecrease = (item: CartItem) => {
    if (item.quantity <= 1) return;
    updateMutation.mutate({ productId: item.product._id, quantity: item.quantity - 1 });
  };
  const onIncrease = (item: CartItem) => {
    const stock = item.product.stock ?? Number.MAX_SAFE_INTEGER;
    if (item.quantity >= stock) { Alert.alert("Stock limit", "No more stock"); return; }
    updateMutation.mutate({ productId: item.product._id, quantity: item.quantity + 1 });
  };

  if (isLoading) return (
    <SafeAreaView style={styles.page}><View style={styles.center}><Text style={styles.muted}>Loading cart...</Text></View></SafeAreaView>
  );
  if (isError) return (
    <SafeAreaView style={styles.page}><View style={styles.center}><Text style={styles.muted}>Failed to load cart</Text></View></SafeAreaView>
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.header}><Text style={styles.headerTitle}>My Cart</Text></View>
        <View style={styles.center}>
          <Ionicons name="cart-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.muted}>Add products to get started</Text>
          <Pressable style={styles.shopBtn} onPress={() => navigation.navigate("Browse")}>
            <Text style={styles.shopBtnText}>Continue Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.itemCount}>{items.length} item{items.length !== 1 ? "s" : ""}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              {item.product.image ? (
                <Image source={{ uri: item.product.image }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="image-outline" size={22} color="#cbd5e1" />
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.brand}>{item.product.brand}</Text>
                <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
                <Text style={styles.unitPrice}>{formatPrice(item.product.price || 0)} each</Text>
              </View>
              <Pressable
                style={styles.removeBtn}
                onPress={() => removeMutation.mutate(item.product._id)}
              >
                <Ionicons name="trash-outline" size={16} color="#dc2626" />
              </Pressable>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.qtyRow}>
                <Pressable
                  style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]}
                  onPress={() => onDecrease(item)}
                >
                  <Ionicons name="remove" size={16} color={item.quantity <= 1 ? "#d1d5db" : "#374151"} />
                </Pressable>
                <Text style={styles.qtyVal}>{item.quantity}</Text>
                <Pressable style={styles.qtyBtn} onPress={() => onIncrease(item)}>
                  <Ionicons name="add" size={16} color="#374151" />
                </Pressable>
              </View>
              <Text style={styles.lineTotal}>{formatPrice((item.product.price || 0) * item.quantity)}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {items.length} item{items.length !== 1 ? "s" : ""}
          </Text>
          <Pressable onPress={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
            <Text style={styles.clearBtn}>{clearMutation.isPending ? "Clearing..." : "Clear all"}</Text>
          </Pressable>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
        </View>
        <Pressable style={styles.checkoutBtn} onPress={() => navigation.navigate("Checkout")}>
          <Ionicons name="lock-closed-outline" size={16} color="#fff" />
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  itemCount: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  muted: { fontSize: 14, color: "#6b7280" },
  shopBtn: {
    marginTop: 8,
    backgroundColor: P,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  list: { padding: 12, gap: 10, paddingBottom: 180 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  thumb: { width: 70, height: 70, borderRadius: 12 },
  thumbPlaceholder: { backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1, gap: 2 },
  brand: { fontSize: 10, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase" },
  name: { fontSize: 14, fontWeight: "700", color: "#111827", lineHeight: 20 },
  unitPrice: { fontSize: 13, color: "#6b7280" },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fee2e2",
    backgroundColor: "#fff5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
    paddingTop: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 4,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyVal: { minWidth: 28, textAlign: "center", fontWeight: "700", fontSize: 15 },
  lineTotal: { fontSize: 16, fontWeight: "800", color: P },
  summary: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14, color: "#6b7280" },
  clearBtn: { fontSize: 13, color: "#dc2626", fontWeight: "600" },
  totalLabel: { fontSize: 17, fontWeight: "700", color: "#111827" },
  totalValue: { fontSize: 22, fontWeight: "800", color: P },
  checkoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: P,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: P,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  checkoutBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
