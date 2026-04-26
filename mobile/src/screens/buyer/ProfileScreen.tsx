import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const P = "#fe424d";
const GREEN = "#059669";

function Avatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials || "?"}</Text>
    </View>
  );
}

function roleBadgeStyle(role: string) {
  if (role === "seller") return { bg: "#dcfce7", text: "#047857" };
  if (role === "admin") return { bg: "#f5f3ff", text: "#6d28d9" };
  return { bg: "#f1f5f9", text: "#475569" };
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const onLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };

  if (!user) return null;

  const roleStyle = roleBadgeStyle(user.role);

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>My Account</Text>
        </View>

        <View style={styles.card}>
          {/* ── Avatar Header ── */}
          <View style={styles.cardHeader}>
            <Avatar name={user.name} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                <Text style={[styles.roleText, { color: roleStyle.text }]}>
                  {user.role.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Info Rows ── */}
          <View style={styles.infoSection}>
            <InfoRow icon="mail-outline" label="Email" value={user.email} />
            <InfoRow icon="briefcase-outline" label="Account Type" value={user.role} />
            <InfoRow icon="shield-checkmark-outline" label="Status" value="Verified" valueColor={GREEN} />
          </View>

          {/* ── Language Toggle ── */}
          <View style={styles.langRow}>
            <View style={styles.langLeft}>
              <View style={styles.langIconWrap}>
                <Ionicons name="language-outline" size={18} color={P} />
              </View>
              <View>
                <Text style={styles.langLabel}>Language</Text>
                <Text style={styles.langValue}>{language === "en" ? "English" : "বাংলা"}</Text>
              </View>
            </View>
            <Pressable onPress={toggleLanguage} style={styles.langToggleBtn}>
              <Text style={styles.langToggleText}>{language === "en" ? "বাংলা" : "English"}</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Sign Out ── */}
        <View style={styles.actionsSection}>
          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>{t("navbar.logout")}</Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as "mail-outline"} size={18} color={P} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f4f6" },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    backgroundColor: "rgba(254,66,77,0.04)",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: P,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: P,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  userInfo: { flex: 1, gap: 3 },
  userName: { fontSize: 18, fontWeight: "800", color: "#111827" },
  userEmail: { fontSize: 13, color: "#6b7280" },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  roleText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  infoSection: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(254,66,77,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 },
  infoValue: { fontSize: 15, fontWeight: "700", color: "#111827", marginTop: 2 },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  langLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  langIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(254,66,77,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  langLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 },
  langValue: { fontSize: 15, fontWeight: "700", color: "#111827", marginTop: 2 },
  langToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  langToggleText: { fontSize: 13, fontWeight: "700", color: "#374151" },
  actionsSection: { paddingHorizontal: 16, marginTop: 16 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  logoutText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
