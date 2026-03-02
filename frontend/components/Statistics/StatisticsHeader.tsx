import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { formatLastUpdated } from "@/utils/healthFormatters";

interface StatisticsHeaderProps {
  lastUpdated: Date;
  onRefresh?: () => void;
}

export const StatisticsHeader: React.FC<StatisticsHeaderProps> = ({
  lastUpdated,
  onRefresh,
}) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>📊 Statistics</Text>
        <Text style={styles.subtitle}>
          Updated {formatLastUpdated(lastUpdated)}
        </Text>
      </View>

      {onRefresh && (
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshIcon: {
    fontSize: 20,
  },
});
