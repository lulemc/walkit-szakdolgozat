import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText } from "../CustomText";
import type { Coordinates } from "@/services/routeService";
import { elevationProfile } from "@/utils/elevationProfile";

const MIN_BAR_HEIGHT = 4;
const MAX_BAR_HEIGHT = 48;

/** The route's ups and downs as small bars, from start to finish */
export const ElevationProfile: React.FC<{ coordinates: Coordinates[] }> = ({ coordinates }) => {
  const theme = useTheme();
  const { t } = useTranslation("planner");
  const profile = useMemo(() => elevationProfile(coordinates), [coordinates]);
  if (!profile) return null;

  const min = t("routeInfo.metres", { value: Math.round(profile.minM) });
  const max = t("routeInfo.metres", { value: Math.round(profile.maxM) });
  const muted = { color: theme.colors.onSurfaceVariant };

  return (
    <View accessible accessibilityLabel={t("routeInfo.profileLabel", { min, max })} style={styles.container}>
      <View style={styles.scale}>
        <CustomText variant="labelSmall" style={muted}>
          {max}
        </CustomText>
        <CustomText variant="labelSmall" style={muted}>
          {min}
        </CustomText>
      </View>
      <View style={styles.bars}>
        {profile.bars.map((bar, index) => (
          <View
            key={index}
            testID="elevation-bar"
            style={[
              styles.bar,
              {
                height: MIN_BAR_HEIGHT + bar * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT),
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  scale: {
    height: MAX_BAR_HEIGHT,
    justifyContent: "space-between",
  },
  bars: {
    flex: 1,
    height: MAX_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 1,
  },
  bar: {
    flex: 1,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    opacity: 0.8,
  },
});
