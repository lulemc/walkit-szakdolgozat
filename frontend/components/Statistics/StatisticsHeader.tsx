import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { formatLastUpdated } from "@/utils/healthFormatters";
import { CustomText } from "../CustomText";

interface StatisticsHeaderProps {
  lastUpdated: Date | null;
  providerName: string;
}

export const StatisticsHeader: React.FC<StatisticsHeaderProps> = ({
  lastUpdated,
  providerName,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <CustomText variant="headlineMedium" style={styles.title}>
        Statistics
      </CustomText>
      <CustomText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {lastUpdated
          ? `Updated ${formatLastUpdated(lastUpdated)} · pull down to refresh`
          : `Your activity from ${providerName}`}
      </CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    fontWeight: "700",
  },
});
