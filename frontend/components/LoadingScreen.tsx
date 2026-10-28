import React from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText } from "./CustomText";

/** Shown while the app reads the login state, after the native splash screen */
export const LoadingScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      accessible
      accessibilityLabel={t("loadingApp")}
      accessibilityRole="progressbar"
    >
      <Image source={require("@/assets/images/icon.png")} style={styles.icon} />
      <CustomText variant="headlineSmall">WalkIt</CustomText>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 20,
  },
});
