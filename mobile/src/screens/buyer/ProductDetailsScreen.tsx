import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RootStackParamList } from "../../../App";
import { useAuth } from "../../context/AuthContext";
import { addToCart } from "../../lib/shopApi";
import { api } from "../../lib/api";
import { Product } from "../../types/product";

type Props = NativeStackScreenProps<RootStackParamList, "ProductDetails">;

const P = "#fe424d";

interface ProductDetailsResponse {
  success: boolean;
  data: Product;
}

async function fetchProduct(id: string) {
  const { data } = await api.get<ProductDetailsResponse>(`/api/products/${id}`);
  return data.data;
}

export function ProductDetailsScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { id } = route.params;
  const { data, isLoading, isError } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  const addMutation = useMutation({
    mutationFn: (productId: string) => addToCart(productId, 1),
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart"], cart);
      Alert.alert("Added to Cart", "Item has been added to your cart.");
    },
    onError: () => Alert.alert("Error", "Failed to add item to cart"),
  });

  if (isLoading) return (
    <SafeAreaView style={styles.page}>
      <ActivityIndicator size="large" color={P} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  if (isError || !data) return (
    <SafeAreaView style={styles.page}>
      <View style={styles.center}><Text style={styles.muted}>Failed to load product</Text></View>
    </SafeAreaView>
  );

  const discount =
    data.originalPrice && data.originalPrice > data.price
      ? Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image */}
        <View style={styles.imageWrap}>
          {data.image ? (
            <Image source={{ uri: data.image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={60} color="#cbd5e1" />
            </View>
          )}
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {data.categoryName ? (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{data.categoryName}</Text>
            </View>
          ) : null}

          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.brand}>{data.brand}</Text>

          {/* Rating */}
          {data.rating !== undefined && (
            <View style={styles.ratingRow}>
              {[1,2,3,4,5].map((s) => (
                <Ionicons
                  key={s}
                  name={(data.rating ?? 0) >= s ? "star" : (data.rating ?? 0) >= s - 0.5 ? "star-half" : "star-outline"}
                  size={14}
                  color="#f59e0b"
                />
              ))}
              {data.reviews ? <Text style={styles.reviewText}>({data.reviews} reviews)</Text> : null}
            </View>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>৳{Number(data.price).toLocaleString()}</Text>
            {data.originalPrice && data.originalPrice > data.price ? (
              <Text style={styles.originalPrice}>৳{Number(data.originalPrice).toLocaleString()}</Text>
            ) : null}
            {discount > 0 && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>Save {discount}%</Text>
              </View>
            )}
          </View>

          {/* Stock */}
          <View style={[styles.stockBadge, { backgroundColor: data.inStock ? "#dcfce7" : "#fee2e2" }]}>
            <Ionicons
              name={data.inStock ? "checkmark-circle" : "close-circle"}
              size={14}
              color={data.inStock ? "#059669" : "#dc2626"}
            />
            <Text style={[styles.stockText, { color: data.inStock ? "#065f46" : "#991b1b" }]}>
              {data.inStock ? `In Stock (${data.stock} available)` : "Out of Stock"}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{data.description || "No description available."}</Text>

          {/* Specs */}
          {data.specifications && Object.keys(data.specifications).length > 0 ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Specifications</Text>
              {Object.entries(data.specifications).map(([key, val]) => (
                <View key={key} style={styles.specRow}>
                  <Text style={styles.specKey}>{key}</Text>
                  <Text style={styles.specVal}>{val}</Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      {user?.role === "buyer" ? (
        <View style={styles.cta}>
          <Pressable
            style={[styles.ctaBtn, (!data.inStock || addMutation.isPending) && { opacity: 0.6 }]}
            onPress={() => addMutation.mutate(data._id)}
            disabled={!data.inStock || addMutation.isPending}
          >
            {addMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="cart-outline" size={20} color="#fff" />
            )}
            <Text style={styles.ctaBtnText}>
              {addMutation.isPending ? "Adding..." : "Add to Cart"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { fontSize: 14, color: "#6b7280" },
  imageWrap: { position: "relative", backgroundColor: "#fff" },
  image: { width: "100%", aspectRatio: 1 },
  imagePlaceholder: { backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center" },
  backBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  discountBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: P,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  body: { padding: 16, gap: 12 },
  categoryChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(254,66,77,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: { fontSize: 12, fontWeight: "700", color: P },
  name: { fontSize: 22, fontWeight: "800", color: "#111827", lineHeight: 30 },
  brand: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  reviewText: { fontSize: 12, color: "#9ca3af", marginLeft: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  price: { fontSize: 28, fontWeight: "800", color: P },
  originalPrice: { fontSize: 16, color: "#9ca3af", textDecorationLine: "line-through" },
  saveBadge: { backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  saveText: { fontSize: 11, fontWeight: "700", color: "#065f46" },
  stockBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  stockText: { fontSize: 12, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 4 },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 },
  description: { fontSize: 14, color: "#6b7280", lineHeight: 22 },
  specRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  specKey: { fontSize: 13, color: "#374151", fontWeight: "600" },
  specVal: { fontSize: 13, color: "#6b7280", maxWidth: "55%", textAlign: "right" },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: P,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: P,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
