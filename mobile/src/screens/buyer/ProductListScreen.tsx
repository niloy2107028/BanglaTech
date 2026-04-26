import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { addToCart } from "../../lib/shopApi";
import { api } from "../../lib/api";
import { Product, ProductListResponse } from "../../types/product";
import { AppNavProp } from "../../types/nav";

const P = "#fe424d";

const CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Beauty", "Sports"];

async function fetchProducts(search: string, category: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (search) params.set("keyword", search);
  if (category && category !== "All") params.set("category", category);
  const { data } = await api.get<ProductListResponse>(`/api/products?${params.toString()}`);
  return data.data || [];
}

function StarRow({ rating = 0 }: { rating?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={rating >= s ? "star" : rating >= s - 0.5 ? "star-half" : "star-outline"}
          size={10}
          color="#f59e0b"
        />
      ))}
    </View>
  );
}

export function ProductListScreen() {
  const navigation = useNavigation<AppNavProp>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data, isLoading, isRefetching } = useQuery<Product[]>({
    queryKey: ["products", search, activeCategory],
    queryFn: () => fetchProducts(search, activeCategory),
  });

  const addMutation = useMutation({
    mutationFn: (productId: string) => addToCart(productId, 1),
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
  });

  const renderCard = ({ item }: { item: Product }) => {
    const discount =
      item.originalPrice && item.originalPrice > item.price
        ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
        : 0;
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("ProductDetails", { id: item._id })}
      >
        <View style={styles.imgWrap}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={[styles.img, styles.imgPlaceholder]}>
              <Ionicons name="image-outline" size={28} color="#cbd5e1" />
            </View>
          )}
          {discount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>-{discount}%</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.brand} numberOfLines={1}>{item.brand}</Text>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <StarRow rating={item.rating} />
          <View style={styles.priceRow}>
            <Text style={styles.price}>৳{Number(item.price).toLocaleString()}</Text>
            {item.originalPrice && item.originalPrice > item.price ? (
              <Text style={styles.origPrice}>৳{Number(item.originalPrice).toLocaleString()}</Text>
            ) : null}
          </View>
          {user?.role === "buyer" ? (
            <Pressable
              style={styles.addBtn}
              onPress={() => addMutation.mutate(item._id)}
            >
              <Ionicons name="cart-outline" size={13} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {/* Category chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
        renderItem={({ item: cat }) => (
          <Pressable
            style={[styles.chip, activeCategory === cat && styles.chipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </Pressable>
        )}
      />

      {/* Product grid */}
      {isLoading || isRefetching ? (
        <ActivityIndicator size="large" color={P} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color="#d1d5db" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
          renderItem={renderCard}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f4f6" },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 14, color: "#111827", paddingVertical: 0 },
  catScroll: { maxHeight: 46 },
  catContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: P, borderColor: P },
  chipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  chipTextActive: { color: "#fff" },
  grid: { padding: 12, paddingBottom: 24 },
  row: { gap: 10 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imgWrap: { position: "relative" },
  img: { width: "100%", aspectRatio: 1 },
  imgPlaceholder: { backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center" },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: P,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  cardBody: { padding: 10, gap: 3 },
  brand: { fontSize: 10, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase" },
  name: { fontSize: 13, fontWeight: "700", color: "#111827", lineHeight: 18 },
  starRow: { flexDirection: "row", gap: 1, marginVertical: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  price: { fontSize: 14, fontWeight: "800", color: P },
  origPrice: { fontSize: 11, color: "#9ca3af", textDecorationLine: "line-through" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: P,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  addBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 15, color: "#9ca3af", fontWeight: "600" },
});
