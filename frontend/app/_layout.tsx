import { useEffect } from "react";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider, useAuth } from "@/context/AuthProvider";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// Defines the background location task at start-up, so the OS can deliver walk locations
import "@/services/walkLocationTask";
import { SnackbarProvider } from "@/context/SnackbarProvider";
import { ThemePreferenceProvider } from "@/context/ThemePreferenceProvider";
import { LanguagePreferenceProvider } from "@/context/LanguagePreferenceProvider";
// Sets up the translations before the first screen renders
import "@/i18n";
import { useAppTheme } from "@/hooks/useAppTheme";
import { LoadingScreen } from "@/components/LoadingScreen";
import { OfflineBanner } from "@/components/OfflineBanner";
import { configureNotifications } from "@/services/pushNotifications";

// Keep the native splash screen until the login state is known (no blank flash)
SplashScreen.preventAutoHideAsync().catch(() => {});
configureNotifications();

function AppContent() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  if (loading) return <LoadingScreen />;

  // The (auth) and (app) groups decide what a logged-in or logged-out user sees
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Slot />
    </View>
  );
}

/** Paper's theme follows the light/dark choice from Settings */
function ThemedApp() {
  const theme = useAppTheme();

  return (
    <PaperProvider
      theme={theme}
      settings={{
        icon: (props) => <Ionicons {...props} />,
      }}
    >
      <SnackbarProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SnackbarProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguagePreferenceProvider>
        <ThemePreferenceProvider>
          <ThemedApp />
        </ThemePreferenceProvider>
      </LanguagePreferenceProvider>
    </GestureHandlerRootView>
  );
}
