import React, { ReactNode } from "react";
import {
  View,
  ScrollView,
  ViewStyle,
  StyleProp,
  RefreshControlProps,
} from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  scrollable = false,
  contentContainerStyle,
  refreshControl,
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
        contentContainerStyle={contentContainerStyle}
        refreshControl={refreshControl}
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
