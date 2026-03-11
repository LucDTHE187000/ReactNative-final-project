import React, { createContext, useContext, useReducer, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "@/services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignout: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  token: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    (prevState: any, action: any) => {
      switch (action.type) {
        case "RESTORE_TOKEN":
          return {
            ...prevState,
            userToken: action.payload.token,
            user: action.payload.user,
            isLoading: false,
          };
        case "SIGN_IN":
          return {
            ...prevState,
            isSignout: false,
            userToken: action.payload.token,
            user: action.payload.user,
          };
        case "SIGN_UP":
          return {
            ...prevState,
            isSignout: false,
          };
        case "SIGN_OUT":
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
            user: null,
          };
        default:
          return prevState;
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
      user: null,
    }
  );

  // ✅ Restore token on app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken = null;
      let user = null;
      try {
        userToken = await AsyncStorage.getItem("token");
        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          user = JSON.parse(userJson);
        }
        if (userToken) {
          API.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;
        }
      } catch (e) {
        console.log("Failed to restore session", e);
      }
      dispatch({ type: "RESTORE_TOKEN", payload: { token: userToken, user } });
    };

    bootstrapAsync();
  }, []);

  // ✅ Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await API.post("/auth/login", { email, password });
      const { token, user } = response.data;

      // Save token to AsyncStorage
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      // Set default header
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      dispatch({
        type: "SIGN_IN",
        payload: { token, user },
      });
    } catch (error: any) {
      throw error.response?.data?.message || "Login failed";
    }
  };

  // ✅ Register function
  const register = async (name: string, email: string, password: string, role: string = "user") => {
    try {
      await API.post("/auth/register", { name, email, password, role });
      dispatch({ type: "SIGN_UP" });
    } catch (error: any) {
      throw error.response?.data?.message || "Registration failed";
    }
  };

  // ✅ Logout function
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      delete API.defaults.headers.common["Authorization"];
    } catch (error) {
      console.error("Logout storage error", error);
    } finally {
      // Always dispatch SIGN_OUT to clear app state
      dispatch({ type: "SIGN_OUT" });
    }
  };

  const value = useMemo(
    () => ({
      user: state.user,
      isLoading: state.isLoading,
      isSignout: state.isSignout,
      login,
      register,
      logout,
      token: state.userToken,
    }),
    [state.user, state.isLoading, state.isSignout, state.userToken, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
