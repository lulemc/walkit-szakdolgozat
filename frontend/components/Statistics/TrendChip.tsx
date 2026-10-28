import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText } from "../CustomText";
import { colors } from "@/theme/colors";

interface TrendChipProps {
  value: number | null;
  label?: string;
}

export const TrendChip: React.FC<TrendChipProps> = ({ value, label }) => {
  const theme = useTheme();
  const { t } = useTranslation("statistics");

  if (value === null) return null;

  const icon = value > 0 ? "trending-up" : value < 0 ? "trending-down" : "remove";
  const iconColor =
    value > 0 ? colors.darkGreen : value < 0 ? colors.error : theme.colors.onSurfaceVariant;
  const text = t("trend.text", {
    change: `${value > 0 ? "+" : ""}${value}`,
    label: label ?? t("trend.vsYesterday"),
  });

  return (
    <View
      style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]}
      accessibilityLabel={text}
    >
      <Icon source={icon} size={14} color={iconColor} />
      <CustomText variant="labelSmall">{text}</CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
