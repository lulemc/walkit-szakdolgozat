import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Icon, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { CustomText } from "./CustomText";

/** A strip at the top while the phone has no internet; nothing otherwise */
export const OfflineBanner: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        // null means "not known yet": only a clear "no" counts as offline
        setOffline(state.isConnected === false || state.isInternetReachable === false);
      }),
    [],
  );

  if (!offline) return null;

  return (
    <View
      style={[styles.banner, { paddingTop: insets.top + 6, backgroundColor: theme.colors.errorContainer }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon source="cloud-offline-outline" size={18} color={theme.colors.onErrorContainer} />
      <CustomText variant="bodySmall" style={{ color: theme.colors.onErrorContainer, flex: 1 }}>
        {t("offline")}
      </CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
});
