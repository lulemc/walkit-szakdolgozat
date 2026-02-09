import React, { createContext, useContext, useEffect, useState } from "react";
import { registerUser, loginUser } from "@/services/authApi";
import { useRouter } from "expo-router";
import { storage } from "@/utils/storage";
import { userStorage } from "@/utils/userStorage";
import { User } from "@/types/User";

interface AuthContextType {
  token: string | null;
  loading: boolean;
  user: User | null;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  loading: true,
  user: null,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

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
    const res = await registerUser({ name, email, password });
    if (!res.token) throw new Error("No token returned from backend");
    await storage.setToken(res.token);
    await userStorage.setUser(res.user);
    setToken(res.token);
    setUser(res.user);
    router.replace("/");
  };

  const login = async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    if (!res.token) throw new Error("No token returned from backend");
    await storage.setToken(res.token);
    await userStorage.setUser(res.user);
    setToken(res.token);
    setUser(res.user);
    router.replace("/");
  };

  const logout = async () => {
    await storage.removeToken();
    await userStorage.removeUser();

    setUser(null);
    setToken(null);
    router.replace("/(auth)/login");
  };

  return (
    <AuthContext.Provider
      value={{ token, user, loading, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
