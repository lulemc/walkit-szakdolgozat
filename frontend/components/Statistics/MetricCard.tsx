import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { TrendChip } from "./TrendChip";

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  trend: number | null;
}

export const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, trend }) => {
  const theme = useTheme();

  return (
    <Card mode="elevated" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <View style={styles.labelRow}>
          <Icon source={icon} size={18} color={theme.colors.primary} />
          <CustomText variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {label}
          </CustomText>
        </View>
        <CustomText variant="titleLarge" style={styles.value}>
          {value}
        </CustomText>
        <TrendChip value={trend} />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  content: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontWeight: "700",
  },
});
