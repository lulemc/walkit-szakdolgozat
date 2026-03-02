// frontend/src/components/Statistics/ErrorState.tsx
// Error state component for statistics screen

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const isPermissionError =
    error.message.includes("permission") ||
    error.message.includes("not initialized");

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{isPermissionError ? "🔒" : "⚠️"}</Text>

      <Text style={styles.title}>
        {isPermissionError ? "Health Access Required" : "Couldn't Load Data"}
      </Text>

      <Text style={styles.message}>
        {isPermissionError
          ? "We need permission to access your health data to show your statistics."
          : "Please check your connection and try again."}
      </Text>

      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>
          {isPermissionError ? "Grant Permission" : "Try Again"}
        </Text>
      </TouchableOpacity>

      {__DEV__ && <Text style={styles.debugText}>Debug: {error.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  debugText: {
    marginTop: 16,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
