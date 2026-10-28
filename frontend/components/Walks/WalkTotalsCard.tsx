import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText } from "../CustomText";
import type { WalkStats } from "@/types/walk";
import { formatElapsed, formatWalkDistance } from "@/utils/walkMetrics";

interface WalkTotalsCardProps {
  title: string;
  stats: WalkStats;
}

/** How many WalkIt walks, how far and how long, e.g. this week */
export const WalkTotalsCard: React.FC<WalkTotalsCardProps> = ({ title, stats }) => {
  const theme = useTheme();
  const { t } = useTranslation("history");
  const values = [
    t("totals.walks", { count: stats.walkCount }),
    formatWalkDistance(stats.totalDistanceM),
    formatElapsed(stats.totalDurationSec),
  ];

  return (
    <Card mode="outlined" accessible accessibilityLabel={`${title}: ${values.join(", ")}`}>
      <Card.Content style={styles.content}>
        <CustomText variant="titleSmall">{title}</CustomText>
        <View style={styles.values}>
          {values.map((value) => (
            <CustomText key={value} variant="titleMedium" style={{ color: theme.colors.primary }}>
              {value}
            </CustomText>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 8,
  },
  values: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
});
