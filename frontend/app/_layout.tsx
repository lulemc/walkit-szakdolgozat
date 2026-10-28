import { useEffect } from "react";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider, useAuth } from "@/context/AuthProvider";
import { lightTheme, darkTheme } from "@/theme/paperTheme";
import { useColorScheme, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// Defines the background location task at start-up, so the OS can deliver walk locations
import "@/services/walkLocationTask";
import { SnackbarProvider } from "@/context/SnackbarProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import { OfflineBanner } from "@/components/OfflineBanner";

// Keep the native splash screen until the login state is known (no blank flash)
SplashScreen.preventAutoHideAsync().catch(() => {});

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

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
