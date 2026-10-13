import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import type { HealthSummary } from "@/utils/healthStats";
import { formatCompactNumber, formatSteps } from "@/utils/healthFormatters";

interface InsightsRowProps {
  summary: HealthSummary;
  streak: number;
  bestDayLabel: (date: Date) => string;
}

export const InsightsRow: React.FC<InsightsRowProps> = ({ summary, streak, bestDayLabel }) => {
  const theme = useTheme();

  const items = [
    { icon: "stats-chart", label: "Daily average", value: `${formatSteps(summary.averageSteps)} steps` },
    {
      icon: "trophy",
      label: "Best day",
      value: `${bestDayLabel(summary.bestDay.date)} · ${formatCompactNumber(summary.bestDay.steps)}`,
    },
    { icon: "checkmark-circle", label: "Active days", value: `${summary.activeDays} of ${summary.dayCount}` },
    { icon: "flame", label: "Current streak", value: `${streak} ${streak === 1 ? "day" : "days"}` },
  ];

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.item, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <Icon source={item.icon} size={16} color={theme.colors.primary} />
          <CustomText variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.label}
          </CustomText>
          <CustomText variant="titleSmall">{item.value}</CustomText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  item: {
    flexGrow: 1,
    flexBasis: "45%",
    padding: 12,
    borderRadius: 12,
    gap: 2,
  },
});
