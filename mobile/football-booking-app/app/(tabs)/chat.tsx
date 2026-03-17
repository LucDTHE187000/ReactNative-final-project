/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: none
 * Description: Màn hình chat cộng đồng realtime sử dụng Socket.IO.
 *   Kết nối tới server với JWT token, join room "general",
 *   hiển thị lịch sử 50 tin nhắn gần nhất, gửi/nhận tin realtime.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/constants/theme";
import { router } from "expo-router";



const getSocketURL = () => {
  const host = Constants.expoConfig?.hostUri?.split(":")?.[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:5000`;
  }
  if (Platform.OS === "android") return "http://10.0.2.2:5000";
  return "http://localhost:5000";
};

const ROOM = "general";

interface Message {
  _id?: string;
  localId?: string;
  sender: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
}



export default function ChatScreen() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Kết nối Socket.IO
  useEffect(() => {
    if (!token) return;

    const socket = io(getSocketURL(), {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setConnecting(false);
      socket.emit("join_room", ROOM);
    });

    socket.on("connect_error", () => {
      setConnecting(false);
      setConnected(false);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    // Lịch sử tin nhắn khi join room
    socket.on("message_history", (history: Message[]) => {
      setMessages(history);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    });

    // Tin nhắn mới realtime
    socket.on("new_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    // Thông báo hệ thống (join/leave)
    socket.on("system_message", (msg: { text: string }) => {
      const sysMsg: Message = {
        localId: Date.now().toString(),
        sender: "system",
        senderName: "Hệ thống",
        senderRole: "system",
        text: msg.text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, sysMsg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text || !socketRef.current || !connected) return;

    socketRef.current.emit("send_message", { text, room: ROOM });
    setInputText("");
  }, [inputText, connected]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return "👑 ";
      case "fieldOwner": return "🏆 ";
      default: return "";
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isOwn = item.sender === user?.id;
    const isSystem = item.sender === "system";

    if (isSystem) {
      return (
        <View style={styles.systemRow}>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, isOwn ? styles.msgRowOwn : styles.msgRowOther]}>
        {!isOwn && (
          <Text style={styles.senderName}>
            {getRoleBadge(item.senderRole)}{item.senderName}
          </Text>
        )}
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
            {item.text}
          </Text>
        </View>
        <Text style={[styles.timeText, isOwn ? styles.timeOwn : styles.timeOther]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{"< Quay lại"}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>💬 Chat Cộng Đồng</Text>
          <View style={[styles.statusDot, { backgroundColor: connected ? "#4CAF50" : "#f44336" }]} />
        </View>
        <View style={{ width: 80 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Message List */}
        {connecting ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.connectingText}>Đang kết nối...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, i) => item._id ?? item.localId ?? String(i)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={connected ? "Nhập tin nhắn..." : "Đang kết nối..."}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            editable={connected}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!connected || !inputText.trim()) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!connected || !inputText.trim()}
          >
            <Text style={styles.sendBtnText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.darkBg },
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 80 },
  backBtnText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  connectingText: { color: colors.textSecondary, fontSize: 14 },

  listContent: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },

  systemRow: { alignItems: "center", marginVertical: 6 },
  systemText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontStyle: "italic",
    backgroundColor: colors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },

  msgRow: { maxWidth: "80%" },
  msgRowOwn: { alignSelf: "flex-end", alignItems: "flex-end" },
  msgRowOther: { alignSelf: "flex-start", alignItems: "flex-start" },

  senderName: { color: colors.primary, fontSize: 11, fontWeight: "700", marginBottom: 4 },

  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bubbleOther: {
    backgroundColor: colors.cardBg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },

  bubbleText: { fontSize: 14, lineHeight: 21 },
  bubbleTextOwn: { color: "#0F1419", fontWeight: "500" },
  bubbleTextOther: { color: colors.textPrimary },

  timeText: { fontSize: 10, marginTop: 4 },
  timeOwn: { color: colors.textSecondary, textAlign: "right" },
  timeOther: { color: colors.textSecondary },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.darkBg,
    color: colors.textPrimary,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#000", fontWeight: "700", fontSize: 14 },
});
