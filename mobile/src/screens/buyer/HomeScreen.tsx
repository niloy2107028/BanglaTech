import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { Product, ProductListResponse } from "../../types/product";
import { AppNavProp } from "../../types/nav";

const P = "#fe424d";
const GREEN = "#059669";

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Electronics", value: "Electronics" },
  { label: "Fashion", value: "Fashion" },
  { label: "Home & Living", value: "Home" },
  { label: "Beauty", value: "Beauty" },
  { label: "Sports", value: "Sports" },
];

async function fetchFeatured(): Promise<Product[]> {
  const { data } = await api.get<ProductListResponse>("/api/products?featured=true&limit=6");
  return data.data || [];
}

function StarRow({ rating = 0, reviews = 0 }: { rating?: number; reviews?: number }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.starRow}>
      {stars.map((s) => (
        <Ionicons
          key={s}
          name={rating >= s ? "star" : rating >= s - 0.5 ? "star-half" : "star-outline"}
          size={11}
          color="#f59e0b"
        />
      ))}
      {reviews > 0 && <Text style={styles.reviewCount}>({reviews})</Text>}
    </View>
  );
}

function MiniCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardImgWrap}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
            <Ionicons name="image-outline" size={28} color="#cbd5e1" />
          </View>
        )}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardBrand} numberOfLines={1}>{product.brand}</Text>
        <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>
        <StarRow rating={product.rating} reviews={product.reviews} />
        <View style={styles.priceRow}>
          <Text style={styles.price}>৳{Number(product.price).toLocaleString()}</Text>
          {product.originalPrice && product.originalPrice > product.price ? (
            <Text style={styles.originalPrice}>
              ৳{Number(product.originalPrice).toLocaleString()}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<AppNavProp>();
  const { user } = useAuth();
  const { data: featured, isLoading } = useQuery({
    queryKey: ["featured"],
    queryFn: fetchFeatured,
  });

  const onSeeAll = useCallback(() => navigation.navigate("Browse"), [navigation]);

  const rows = [];
  const items = featured || [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerBrand}>BanglaMart</Text>
            <Text style={styles.headerSub}>Bangladesh's Best Tech Shop</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={onSeeAll}>
              <Ionicons name="search-outline" size={22} color="#374151" />
            </Pressable>
            {user?.role === "buyer" ? (
              <Pressable style={styles.iconBtn} onPress={() => navigation.navigate("Cart")}>
                <Ionicons name="cart-outline" size={22} color="#374151" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* ── Hero Card ── */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="flash" size={13} color={GREEN} />
            <Text style={styles.heroBadgeText}>Free delivery above ৳999</Text>
          </View>
          <Text style={styles.heroTitle}>
            {"বাংলাদেশের সেরা\nশপিং অভিজ্ঞতা"}
          </Text>
          <Text style={styles.heroSub}>
            Discover the latest electronics, fashion & more at the best prices.
          </Text>
          <Pressable style={styles.heroBtn} onPress={onSeeAll}>
            <Text style={styles.heroBtnText}>Shop Now</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        </View>

        {/* ── Categories ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                style={styles.catChip}
                onPress={() => navigation.navigate("Browse")}
              >
                <Text style={styles.catChipText}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Featured Products ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <Pressable onPress={onSeeAll}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={P} style={{ marginTop: 16 }} />
          ) : rows.length === 0 ? (
            <Text style={styles.empty}>No featured products yet</Text>
          ) : (
            rows.map((row, ri) => (
              <View key={ri} style={styles.gridRow}>
                {row.map((product) => (
                  <View key={product._id} style={styles.gridCell}>
                    <MiniCard
                      product={product}
                      onPress={() => navigation.navigate("ProductDetails", { id: product._id })}
                    />
                  </View>
                ))}
                {row.length === 1 && <View style={styles.gridCell} />}
              </View>
            ))
          )}
        </View>

        {/* ── Footer banner ── */}
        <View style={styles.footerBanner}>
          <Ionicons name="shield-checkmark" size={18} color={GREEN} />
          <Text style={styles.footerText}>100% Secure Payments · Easy Returns · Fast Delivery</Text>
        </View>
        <View style={{ height: 16 }} />
      </ScrollView>
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerBrand: { fontSize: 20, fontWeight: "800", color: P },
  headerSub: { fontSize: 11, color: "#6b7280", marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 4 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.8)",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(5,150,105,0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  heroBadgeText: { fontSize: 12, fontWeight: "700", color: "#047857" },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 34,
    marginBottom: 10,
  },
  heroSub: { fontSize: 14, color: "#6b7280", lineHeight: 21, marginBottom: 18 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: P,
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  heroBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#111827", marginBottom: 12 },
  seeAll: { fontSize: 13, color: P, fontWeight: "700" },
  categoryScroll: { marginBottom: 4 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
  },
  catChipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  gridRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  gridCell: { flex: 1 },
  card: {
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
  cardImgWrap: { position: "relative" },
  cardImg: { width: "100%", aspectRatio: 1 },
  cardImgPlaceholder: {
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: P,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  cardBody: { padding: 10 },
  cardBrand: { fontSize: 10, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", marginBottom: 2 },
  cardName: { fontSize: 13, fontWeight: "700", color: "#111827", lineHeight: 18, marginBottom: 4 },
  starRow: { flexDirection: "row", alignItems: "center", gap: 1, marginBottom: 6 },
  reviewCount: { fontSize: 10, color: "#9ca3af", marginLeft: 3 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  price: { fontSize: 15, fontWeight: "800", color: P },
  originalPrice: { fontSize: 11, color: "#9ca3af", textDecorationLine: "line-through" },
  empty: { color: "#9ca3af", textAlign: "center", paddingVertical: 20, fontSize: 14 },
  footerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    backgroundColor: "rgba(5,150,105,0.07)",
    borderRadius: 12,
  },
  footerText: { fontSize: 12, color: "#047857", fontWeight: "600", flex: 1 },
});
