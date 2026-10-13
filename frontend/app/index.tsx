import { useAuth } from "@/context/AuthProvider";
import { Redirect } from "expo-router";
import Home from "./(app)/home";
import { Navigation } from "@/components/Navigation/Navigation";
import { View } from "react-native";

export default function Index() {
  const { token, loading } = useAuth();

  if (loading) return null;

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Navigation>
        <Home />
      </Navigation>
    </View>
  );
}
