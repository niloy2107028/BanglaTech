import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../lib/api";
import { AppNavProp } from "../types/nav";

const TEAL = "#0f8b8d";
const TEAL_DARK = "#0a6b6c";
const TAB_BAR_H = 60;
const { height: SCREEN_H } = Dimensions.get("window");

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  cards?: ProductCard[];
}

interface ProductCard {
  productId?: string;
  name?: string;
  image?: string;
  price?: number;
  description?: string;
  rating?: number;
  currencySymbol?: string;
}

const HISTORY_LIMIT = 5;

function toPayload(msgs: ChatMessage[]) {
  return msgs.slice(-HISTORY_LIMIT).map((m) => ({
    role: m.role,
    content: m.content,
    products: (m.cards ?? []).map((c) => c.productId ?? "").filter(Boolean),
  }));
}

function MsgText({ text, isUser }: { text: string; isUser: boolean }) {
  const color = isUser ? "#fff" : "#0f172a";
  const lines = text.split("\n");
  return (
    <View style={{ gap: 2 }}>
      {lines.map((line, li) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <Text key={li} style={{ fontSize: 13.5, lineHeight: 20, color }}>
            {parts.map((p, pi) =>
              pi % 2 === 1 ? (
                <Text key={pi} style={{ fontWeight: "800" }}>
                  {p}
                </Text>
              ) : (
                p
              )
            )}
          </Text>
        );
      })}
    </View>
  );
}

export function ChatbotWidget() {
  const navigation = useNavigation<AppNavProp>();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am the BanglaMart AI. How can I help you today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const scrollDown = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    scrollDown();

    try {
      const { data } = await api.post("/api/chatbot/chat", {
        message: text,
        history: toPayload(next),
      });
      const cards: ProductCard[] = Array.isArray(data?.cards) ? data.cards : [];
      const reply = String(data?.reply ?? "").trim();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply || (cards.length > 0 ? "" : "Sorry, no response."),
          cards,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm facing a system issue right now.",
        },
      ]);
    } finally {
      setLoading(false);
      scrollDown();
    }
  };

  const openCard = (productId: string) => {
    setIsOpen(false);
    setTimeout(() => navigation.navigate("ProductDetails", { id: productId }), 300);
  };

  const fabBottom = insets.bottom + TAB_BAR_H + 14;

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    const cards = (item.cards ?? []).filter((c) => c.name);
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.roleLabel, { color: isUser ? "rgba(255,255,255,0.75)" : "#64748b" }]}>
            {isUser ? "You" : "BanglaMart AI"}
          </Text>
          {item.content ? <MsgText text={item.content} isUser={isUser} /> : null}
          {cards.length > 0 && (
            <View style={styles.cardList}>
              {cards.map((card, ci) => (
                <Pressable
                  key={`${card.productId ?? card.name}-${ci}`}
                  style={styles.card}
                  onPress={() => card.productId && openCard(card.productId)}
                >
                  {card.image ? (
                    <Image source={{ uri: card.image }} style={styles.cardImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
                      <Ionicons name="image-outline" size={20} color="#94a3b8" />
                    </View>
                  )}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName} numberOfLines={2}>
                      {card.name}
                    </Text>
                    <Text style={styles.cardPrice}>
                      {card.currencySymbol ?? "৳"}
                      {Number(card.price ?? 0).toLocaleString()}
                      {card.rating ? `  ★ ${Number(card.rating).toFixed(1)}` : ""}
                    </Text>
                    {card.description ? (
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {card.description}
                      </Text>
                    ) : null}
                    {card.productId ? (
                      <Text style={styles.cardLink}>View Product →</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      <Pressable
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={() => setIsOpen(true)}
      >
        <View style={styles.fabDot} />
        <Ionicons name="chatbubbles-outline" size={22} color="#fff" />
        <Text style={styles.fabLabel}>AI</Text>
      </Pressable>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.overlayDismiss} onPress={() => setIsOpen(false)} />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.chatWindow, { height: SCREEN_H * 0.87 }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerAvatar}>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>BanglaMart AI</Text>
                  <View style={styles.headerStatusRow}>
                    <View style={styles.headerOnlineDot} />
                    <Text style={styles.headerSub}>24/7 Support</Text>
                  </View>
                </View>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={16} color="#fff" />
              </Pressable>
            </View>

            {/* Messages */}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(_, i) => String(i)}
              renderItem={renderItem}
              contentContainerStyle={styles.msgList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              ListFooterComponent={
                loading ? (
                  <View style={styles.msgRowAI}>
                    <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                      <Text style={[styles.roleLabel, { color: "#64748b" }]}>
                        BanglaMart AI
                      </Text>
                      <View style={styles.typingRow}>
                        <ActivityIndicator size="small" color={TEAL} />
                        <Text style={styles.typingText}>Typing...</Text>
                      </View>
                    </View>
                  </View>
                ) : null
              }
            />

            {/* Input bar */}
            <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask me anything..."
                placeholderTextColor="#94a3b8"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={send}
                blurOnSubmit={false}
              />
              <Pressable
                style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.45 }]}
                onPress={send}
                disabled={!input.trim() || loading}
              >
                <Ionicons name="send" size={16} color="#fff" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  /* FAB */
  fab: {
    position: "absolute",
    right: 16,
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: TEAL,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 999,
  },
  fabDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 13,
    height: 13,
    borderRadius: 999,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },
  fabLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
    marginTop: 1,
  },

  /* Modal overlay */
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  overlayDismiss: {
    flex: 1,
  },

  /* Chat window */
  chatWindow: {
    backgroundColor: "#f4f7fb",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: TEAL,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "800", color: "#fff" },
  headerStatusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  headerOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#4ade80",
  },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Messages */
  msgList: { padding: 14, gap: 10, paddingBottom: 6 },
  msgRow: { flexDirection: "row", marginBottom: 6 },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAI: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "85%",
    borderRadius: 18,
    padding: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  bubbleUser: {
    backgroundColor: TEAL,
    borderBottomRightRadius: 5,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bubbleAI: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#dbe5f2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  roleLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },

  /* Typing */
  typingBubble: { minWidth: 120 },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { fontSize: 12, color: "#64748b", fontWeight: "600" },

  /* Product cards */
  cardList: { marginTop: 8, gap: 8 },
  card: {
    flexDirection: "row",
    backgroundColor: "#f8fbff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d9e4ef",
    padding: 8,
    gap: 10,
  },
  cardImg: { width: 64, height: 64, borderRadius: 9 },
  cardImgPlaceholder: { backgroundColor: "#e8f4f5", justifyContent: "center", alignItems: "center" },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: 12.5, fontWeight: "700", color: "#1e293b" },
  cardPrice: { fontSize: 12, fontWeight: "700", color: TEAL },
  cardDesc: { fontSize: 11, color: "#475569", lineHeight: 16 },
  cardLink: { fontSize: 11, fontWeight: "700", color: TEAL, marginTop: 2 },

  /* Input */
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e4edf7",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: "#f4f7fb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d4deea",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: "#0f172a",
    lineHeight: 18,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: TEAL,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
