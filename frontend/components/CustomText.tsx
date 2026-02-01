import { colors } from "@/theme/colors";
import React, { ReactNode } from "react";
import { Text, TextProps } from "react-native-paper";
import { useTheme } from "react-native-paper";

interface CustomTextProps extends TextProps<any> {
  children: ReactNode;
  custom?: "link" | "span" | "error";
}

export const CustomText: React.FC<CustomTextProps> = ({
  children,
  variant = "bodyMedium",
  style,
  custom,
  ...props
}) => {
  const theme = useTheme();

  switch (custom) {
    case "link":
      style = [{ color: colors.khaki }, style];
      break;
    case "span":
      style = [{ color: colors.secondary }, style];
      break;
    case "error":
      style = [{ color: colors.error }, style];
      break;
    default:
      style = [{ color: theme.colors.onSurface }, style];
      break;
  }

  return (
    <Text variant={variant} style={style} {...props}>
      {children}
    </Text>
  );
};
