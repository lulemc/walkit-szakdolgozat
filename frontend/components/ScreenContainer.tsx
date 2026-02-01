import React, { ReactNode } from "react";
import { View, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

interface ScreenContainerProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.background,
          flex: 1,
          padding: 24,
          justifyContent: "center",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
