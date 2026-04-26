import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RootStackParamList } from "../../../App";
import { createOrder, getCart } from "../../lib/shopApi";
import { ShippingAddress } from "../../types/order";

type Props = NativeStackScreenProps<RootStackParamList, "Checkout">;

const P = "#fe424d";

const initialAddress: ShippingAddress = {
  address: "",
  city: "",
  postalCode: "",
  phone: "",
};

function formatPrice(value: number) {
  return `৳ ${Number(value || 0).toLocaleString()}`;
}

export function CheckoutScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(initialAddress);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const items = data?.items || [];

  const totalPrice = useMemo(
    () => items.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0),
    [items],
  );

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      Alert.alert("Order Placed!", "Your order has been placed successfully.", [
        { text: "OK", onPress: () => navigation.navigate("MainTabs") },
      ]);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to place order";
      Alert.alert("Order Error", message);
    },
  });

  const onChange = (key: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = () => {
    if (items.length === 0) {
      Alert.alert("Cart Empty", "Please add products before checkout");
      navigation.goBack();
      return;
    }

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.phone) {
      Alert.alert("Missing Info", "Please fill in all shipping fields");
      return;
    }

    mutation.mutate({
      orderItems: items.map((item) => ({
        name: item.product.name,
        qty: item.quantity,
        image: item.product.image || "",
        price: item.product.price || 0,
        product: item.product._id,
      })),
      shippingAddress,
      totalPrice,
    });
  };

  if (isLoading) return (
    <SafeAreaView style={styles.page}>
      <ActivityIndicator size="large" color={P} style={{ marginTop: 40 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <Text style={styles.topTitle}>Checkout</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Shipping card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={18} color={P} />
              <Text style={styles.sectionTitle}>Shipping Information</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Full address"
              placeholderTextColor="#9ca3af"
              multiline
              value={shippingAddress.address}
              onChangeText={(v) => onChange("address", v)}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="City"
                placeholderTextColor="#9ca3af"
                value={shippingAddress.city}
                onChangeText={(v) => onChange("city", v)}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Postal code"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={shippingAddress.postalCode}
                onChangeText={(v) => onChange("postalCode", v)}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={shippingAddress.phone}
              onChangeText={(v) => onChange("phone", v)}
            />
          </View>

          {/* Payment method */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash-outline" size={18} color={P} />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
            <View style={styles.payMethod}>
              <View style={styles.payMethodDot} />
              <Text style={styles.payMethodText}>Cash on Delivery (COD)</Text>
            </View>
          </View>

          {/* Order summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt-outline" size={18} color={P} />
              <Text style={styles.sectionTitle}>Order Summary ({items.length} items)</Text>
            </View>
            {items.map((item) => (
              <View key={item.product._id} style={styles.summaryRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product.name} × {item.quantity}
                </Text>
                <Text style={styles.itemPrice}>{formatPrice((item.product.price || 0) * item.quantity)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Order Total</Text>
              <Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerTotal}>{formatPrice(totalPrice)}</Text>
          </View>
          <Pressable
            style={[styles.placeBtn, mutation.isPending && { opacity: 0.7 }]}
            onPress={onSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            )}
            <Text style={styles.placeBtnText}>
              {mutation.isPending ? "Placing Order..." : "Place Order"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f4f6" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  topTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  scroll: { padding: 16, gap: 14 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#f9fafb",
    fontSize: 14,
    color: "#111827",
  },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  payMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  payMethodDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: P,
    borderWidth: 4,
    borderColor: "#fce7e8",
  },
  payMethodText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  itemName: { flex: 1, fontSize: 13, color: "#374151" },
  itemPrice: { fontSize: 13, fontWeight: "700", color: "#111827" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: "700", color: "#111827" },
  totalValue: { fontSize: 17, fontWeight: "800", color: P },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerLabel: { fontSize: 14, color: "#6b7280" },
  footerTotal: { fontSize: 20, fontWeight: "800", color: P },
  placeBtn: {
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
  placeBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
