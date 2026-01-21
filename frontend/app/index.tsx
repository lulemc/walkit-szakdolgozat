import { useAuth } from "@/context/AuthProvider";
import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Text, useTheme } from "react-native-paper";

export default function Index() {
  const router = useRouter();
  const theme = useTheme();

  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace("/registration");
    }
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={styles.title} variant="headlineMedium">
        Welcome to the App! {token ? token : "halo"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
  },
});
