import React, { ReactNode } from "react";
import { View, ScrollView, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  contentContainerStyle?: any;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  scrollable = false,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (scrollable) {
    return (
      <ScrollView
        style={[
          {
            backgroundColor: theme.colors.background,
            padding: 24,
            marginTop: insets.top,
          },
          style,
        ]}
      >
        {children}
      </ScrollView>
    );
  }

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
