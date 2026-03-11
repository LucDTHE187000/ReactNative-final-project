import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const getBaseURL = () => {
  const host = Constants.expoConfig?.hostUri?.split(":")?.[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    // Physical device via Expo Go — host là LAN IP của máy dev
    return `http://${host}:5000/api`;
  }
  if (Platform.OS === "android") {
    // Android emulator
    return "http://10.0.2.2:5000/api";
  }
  // iOS simulator
  return "http://localhost:5000/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
});

// Add token to requests
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: imagePath - đường dẫn ảnh từ API (relative hoặc full URL localhost)
 * Description: Build full image URL dùng dynamic base URL (LAN IP) thay vì hardcode localhost.
 *   Xử lý 3 case: relative path, localhost URL cũ, và URL đã đúng.
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  const baseURL = API.defaults.baseURL || "";
  const serverURL = baseURL.replace("/api", "");

  // Relative path: /uploads/images/... hoặc /images/...
  if (imagePath.startsWith("/")) {
    return `${serverURL}${imagePath}`;
  }

  // Full URL với localhost hoặc 127.0.0.1 → thay bằng dynamic server URL
  if (imagePath.startsWith("http") && (imagePath.includes("localhost") || imagePath.includes("127.0.0.1"))) {
    try {
      const url = new URL(imagePath);
      return `${serverURL}${url.pathname}`;
    } catch {
      return imagePath;
    }
  }

  // URL bình thường (đã có LAN IP đúng) → dùng nguyên
  return imagePath;
};

export default API;
