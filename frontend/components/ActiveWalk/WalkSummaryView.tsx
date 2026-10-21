import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { CustomText, PrimaryButton, ScreenContainer } from "@/components";
import { formatElapsed, formatPace, formatWalkDistance } from "@/utils/walkMetrics";

export type FavoriteState = "hidden" | "available" | "saving" | "saved";

interface WalkSummaryViewProps {
  distanceM: number;
  elapsedSec: number;
  saving: boolean;
  /** Why saving or favouriting failed, if it did */
  error: string | null;
  favorite: FavoriteState;
  onSave: () => void;
  onDiscard: () => void;
  onFavorite: () => void;
}

/** After a walk: what was walked, and whether to keep it */
export const WalkSummaryView: React.FC<WalkSummaryViewProps> = ({
  distanceM,
  elapsedSec,
  saving,
  error,
  favorite,
  onSave,
  onDiscard,
  onFavorite,
}) => {
  const theme = useTheme();
  const stats = [
    { label: "Distance", value: formatWalkDistance(distanceM) },
    { label: "Time", value: formatElapsed(elapsedSec) },
    { label: "Pace", value: formatPace(elapsedSec, distanceM), unit: "min/km" },
  ];

  return (
    <ScreenContainer scrollable style={styles.screen} contentContainerStyle={styles.content}>
      <CustomText variant="headlineMedium" style={styles.title}>
        Walk complete! 🎉
      </CustomText>

      <Card mode="outlined">
        <Card.Content style={styles.stats}>
          {stats.map(({ label, value, unit }) => (
            <View key={label} style={styles.stat}>
              <CustomText variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {label}
              </CustomText>
              <CustomText variant="titleLarge" style={styles.value}>
                {value}
              </CustomText>
              {unit ? (
                <CustomText variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {unit}
                </CustomText>
              ) : null}
            </View>
          ))}
        </Card.Content>
      </Card>

      {favorite !== "hidden" ? (
        <PrimaryButton
          mode="outlined"
          icon={favorite === "saved" ? "heart" : "heart-outline"}
          onPress={onFavorite}
          loading={favorite === "saving"}
          disabled={favorite !== "available"}
        >
          {favorite === "saved" ? "In your favourites" : "Add route to favourites"}
        </PrimaryButton>
      ) : null}

      {error ? (
        <CustomText variant="bodySmall" style={[styles.center, { color: theme.colors.error }]}>
          {error}
        </CustomText>
      ) : null}

      <PrimaryButton icon="save-outline" onPress={onSave} loading={saving} disabled={saving}>
        Save walk
      </PrimaryButton>
      <PrimaryButton mode="text" onPress={onDiscard} disabled={saving} textColor={theme.colors.error}>
        Discard
      </PrimaryButton>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 24,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: 16,
  },
  title: {
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  value: {
    fontWeight: "700",
  },
  center: {
    textAlign: "center",
  },
});
