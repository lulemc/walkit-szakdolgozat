import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { colors } from "@/theme/colors";

interface TrendChipProps {
  value: number | null;
  label?: string;
}

export const TrendChip: React.FC<TrendChipProps> = ({ value, label = "vs yesterday" }) => {
  const theme = useTheme();

  if (value === null) return null;

  const icon = value > 0 ? "trending-up" : value < 0 ? "trending-down" : "remove";
  const iconColor =
    value > 0 ? colors.darkGreen : value < 0 ? colors.error : theme.colors.onSurfaceVariant;
  const text = `${value > 0 ? "+" : ""}${value}% ${label}`;

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
