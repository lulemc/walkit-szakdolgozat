import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const EmptyState: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📊</Text>

      <Text style={styles.title}>No Data Yet</Text>

      <Text style={styles.message}>
        Start walking to see your statistics here!
      </Text>

      <Text style={styles.tip}>
        💡 Tip: Make sure Health app is tracking your activity
      </Text>
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
  tip: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    fontStyle: "italic",
  },
});
