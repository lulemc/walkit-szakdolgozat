import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { registerUser, loginUser } from "@/services/authApi";
import { useRouter } from "expo-router";
import { storage } from "@/utils/storage";
import { setUnauthorizedHandler } from "@/services/api";
import { useSnackbar } from "@/context/SnackbarProvider";
import { userStorage } from "@/utils/userStorage";
import { User } from "@/types/User";
import i18n from "@/i18n";
import { registerForPushNotifications, unregisterPushNotifications } from "@/services/pushNotifications";

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
  const { showMessage } = useSnackbar();
  // Read by the 401 handler, which is registered once
  const tokenRef = useRef<string | null>(null);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          storage.getToken(),
          userStorage.getUser(),
        ]);
        setToken(storedToken);
        setUser(storedUser);
      } catch {
        // Nothing stored or unreadable: start logged out
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

  // Notifications follow the logged-in user, in the app's current language
  const userId = user?._id;
  useEffect(() => {
    if (!token || !userId) return;
    registerForPushNotifications(userId, i18n.language);
    const onLanguageChanged = (language: string) => {
      registerForPushNotifications(userId, language);
    };
    i18n.on("languageChanged", onLanguageChanged);
    return () => i18n.off("languageChanged", onLanguageChanged);
  }, [token, userId]);

  const endSession = async () => {
    await storage.removeToken();
    await userStorage.removeUser();

    setUser(null);
    setToken(null);
    router.replace("/(auth)/login");
  };

  const logout = async () => {
    // While the token still works: this phone shouldn't get the user's notifications any more
    if (userId) await unregisterPushNotifications(userId);
    await endSession();
  };

  // A 401 means the token expired or was revoked (e.g. after a password change elsewhere)
  const handleUnauthorized = async () => {
    if (tokenRef.current) {
      showMessage(i18n.t("auth:sessionExpired"), { type: "error" });
    }
    // Not logout(): the backend can't be asked to forget the phone with a token it rejects
    await endSession();
  };

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, loading, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
