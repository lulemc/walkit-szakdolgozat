import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { CustomText } from "@/components/CustomText";

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  active?: boolean;
  variant?: "default" | "error";
}

export default function ActionButton({
  label,
  onPress,
  active = false,
  variant = "default",
}: ActionButtonProps) {
  const theme = useTheme();

  const backgroundColor = active
    ? theme.colors.primary
    : variant === "error"
      ? theme.colors.errorContainer
      : theme.colors.surface;

  const textColor = active
    ? "#fff"
    : variant === "error"
      ? theme.colors.error
      : theme.colors.onSurface;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }]}
      onPress={onPress}
    >
      <CustomText
        variant="bodySmall"
        style={{ color: textColor, fontWeight: active ? "600" : "400" }}
      >
        {label}
      </CustomText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
