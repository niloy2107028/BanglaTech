import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cancelOrderItem, getMyOrders } from "../../lib/shopApi";
import { Order } from "../../types/order";
import { AppNavProp } from "../../types/nav";

const P = "#fe424d";

function formatPrice(value: number) {
  return `৳ ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function statusColors(status: string) {
  const map: Record<string, { bg: string; text: string }> = {
    Processing: { bg: "#fef3c7", text: "#92400e" },
    Shipped: { bg: "#dbeafe", text: "#1e40af" },
    Delivered: { bg: "#dcfce7", text: "#065f46" },
    Cancelled: { bg: "#fee2e2", text: "#991b1b" },
    Pending: { bg: "#f3f4f6", text: "#374151" },
  };
  return map[status] ?? map.Pending;
}

export function OrdersScreen() {
  const navigation = useNavigation<AppNavProp>();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({ queryKey: ["orders"], queryFn: getMyOrders });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, productId }: { orderId: string; productId: string }) =>
      cancelOrderItem(orderId, productId, "Cancelled by buyer from app"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => Alert.alert("Error", "Failed to cancel item"),
  });

  if (isLoading) return (
    <SafeAreaView style={styles.page}>
      <ActivityIndicator size="large" color={P} style={{ marginTop: 40 }} />
    </SafeAreaView>
  );

  if (isError) return (
    <SafeAreaView style={styles.page}>
      <View style={styles.center}><Text style={styles.muted}>Failed to load orders</Text></View>
    </SafeAreaView>
  );

  const orders = data || [];

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.orderCount}>{orders.length} order{orders.length !== 1 ? "s" : ""}</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={56} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.muted}>Your order history will appear here</Text>
          <Pressable style={styles.shopBtn} onPress={() => navigation.navigate("Browse")}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OrderCard order={item} onCancel={cancelMutation.mutate} loading={cancelMutation.isPending} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function OrderCard({
  order,
  onCancel,
  loading,
}: {
  order: Order;
  onCancel: (variables: { orderId: string; productId: string }) => void;
  loading: boolean;
}) {
  const { bg, text } = statusColors(order.status);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
          <Text style={[styles.statusText, { color: text }]}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {order.orderItems.map((orderItem) => {
        const { bg: iBg, text: iText } = statusColors(orderItem.status);
        return (
          <View key={`${order._id}-${orderItem.product}`} style={styles.itemRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.itemName} numberOfLines={2}>{orderItem.name}</Text>
              <Text style={styles.itemMeta}>Qty: {orderItem.qty} · {formatPrice(orderItem.price)}</Text>
              <View style={[styles.itemStatus, { backgroundColor: iBg }]}>
                <Text style={[styles.itemStatusText, { color: iText }]}>{orderItem.status}</Text>
              </View>
            </View>
            {orderItem.status === "Pending" ? (
              <Pressable
                style={styles.cancelBtn}
                disabled={loading}
                onPress={() => onCancel({ orderId: order._id, productId: orderItem.product })}
              >
                <Text style={styles.cancelText}>{loading ? "..." : "Cancel"}</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Order Total</Text>
        <Text style={styles.totalPrice}>{formatPrice(order.totalPrice)}</Text>
      </View>
    </View>
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
  orderCount: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  muted: { fontSize: 14, color: "#6b7280" },
  shopBtn: { marginTop: 8, backgroundColor: P, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  shopBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  list: { padding: 12, gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 15, fontWeight: "800", color: "#111827" },
  date: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#f1f5f9" },
  itemRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  itemName: { fontSize: 13, fontWeight: "700", color: "#111827" },
  itemMeta: { fontSize: 12, color: "#6b7280" },
  itemStatus: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 3 },
  itemStatusText: { fontSize: 10, fontWeight: "700" },
  cancelBtn: { borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#fff5f5" },
  cancelText: { color: "#dc2626", fontWeight: "700", fontSize: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10 },
  totalLabel: { fontSize: 14, fontWeight: "700", color: "#374151" },
  totalPrice: { fontSize: 16, fontWeight: "800", color: P },
});
