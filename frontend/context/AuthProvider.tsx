import React, { createContext, useContext, useEffect, useState } from "react";
import { registerUser } from "@/services/authApi";
import { useRouter } from "expo-router";
import { storage } from "@/utils/storage";

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
        const storedToken = await storage.getToken();
        console.log("Loaded token:", storedToken);
        setToken(storedToken);
      } catch (err) {
        console.error("Failed to load token", err);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await registerUser({ name, email, password });
      console.info("Registration response:", res);

      if (!res.token) {
        throw new Error("No token returned from backend");
      }

      await storage.setToken(res.token);
      setToken(res.token);

      router.replace("/home");
    } catch (err: any) {
      console.error("Registration failed:", err.response?.data || err.message);
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
