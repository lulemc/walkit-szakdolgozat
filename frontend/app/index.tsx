import { useAuth } from "@/context/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import Home from "./(app)/home";
import { Navigation } from "@/components/Navigation/Navigation";
import { View } from "react-native";

export default function Index() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Navigation>
        <Home />
      </Navigation>
    </View>
  );
}
