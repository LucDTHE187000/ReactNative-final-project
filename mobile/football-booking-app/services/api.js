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

export default API;
