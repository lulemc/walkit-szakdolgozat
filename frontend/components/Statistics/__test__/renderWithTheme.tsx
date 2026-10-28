import React from "react";
import { render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { MD3Theme } from "react-native-paper";
import { lightTheme } from "@/theme/paperTheme";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export const renderWithTheme = (ui: React.ReactElement, { theme = lightTheme }: { theme?: MD3Theme } = {}) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <PaperProvider theme={theme} settings={{ icon: (props) => <Ionicons {...(props as any)} /> }}>
        {ui}
      </PaperProvider>
    </SafeAreaProvider>,
  );
