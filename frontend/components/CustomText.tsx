import { colors } from "@/theme/colors";
import React, { ReactNode } from "react";
import { Text, TextProps, useTheme } from "react-native-paper";

// `never`: only the theme's own text variants (no custom ones)
interface CustomTextProps extends TextProps<never> {
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
