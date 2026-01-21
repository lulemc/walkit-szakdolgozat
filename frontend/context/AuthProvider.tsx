import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { registerUser } from "@/services/authApi";
import { useRouter } from "expo-router";

interface AuthContextType {
  token: string | null;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  loading: true,
  register: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        console.log("Loaded token from storage:", storedToken);
        setToken(storedToken);
      } catch (err) {
        console.log("Failed to load token", err);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const saveToken = async (newToken: string) => {
    await SecureStore.setItemAsync("token", newToken);
    setToken(newToken);
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await registerUser({ name, email, password });
      console.log("Registration response:", res);

      if (!res.token) {
        throw new Error("No token returned from backend");
      }

      await saveToken(res.token);
      router.replace("/home"); // go to home after registration
    } catch (err: any) {
      console.log("Registration failed:", err.response?.data || err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ token, loading, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
