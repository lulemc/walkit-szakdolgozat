import { useAuth } from "@/context/AuthProvider";
import { useState, useEffect } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace("/registration");
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome to the App! {token ? token : "halo"}</Text>
    </View>
  );
}
