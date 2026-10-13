import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { formatLastUpdated } from "@/utils/healthFormatters";
import { CustomText } from "../CustomText";

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
        <CustomText variant="titleLarge">📊 Statistics</CustomText>
        <CustomText>Updated {formatLastUpdated(lastUpdated)}</CustomText>
      </View>

      {onRefresh && (
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <CustomText style={styles.refreshIcon}>🔄</CustomText>
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
    height: 100,
  },
  refreshButton: {
    width: 40,
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshIcon: {
    fontSize: 17,
  },
});
