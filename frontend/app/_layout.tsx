import { Slot } from "expo-router";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider, useAuth } from "@/context/AuthProvider";
import { lightTheme, darkTheme } from "@/theme/paperTheme";
import { useColorScheme, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function AppContent() {
  const { token, loading } = useAuth();

  if (loading)
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );

  if (!token) {
    return <Slot />; // Slot will render registration screen
  }

  // Token exists → render main app
  return <Slot />;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? darkTheme : lightTheme;

  return (
    <PaperProvider
      theme={theme}
      settings={{
        icon: (props) => <Ionicons {...props} />,
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PaperProvider>
  );
}
