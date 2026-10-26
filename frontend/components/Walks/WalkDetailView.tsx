import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { CustomText, PrimaryButton, ScreenContainer } from "@/components";
import { useWalkDetail } from "@/hooks/useWalkDetail";
import { formatWalkTime } from "@/utils/groupWalkTime";
import { formatElapsed, formatPace, formatWalkDistance } from "@/utils/walkMetrics";
import { WalkPathMap } from "./WalkPathMap";

interface WalkDetailViewProps {
  walkId: string;
  onBack: () => void;
}

/** One saved walk: where I went, how far and how long */
export const WalkDetailView: React.FC<WalkDetailViewProps> = ({ walkId, onBack }) => {
  const theme = useTheme();
  const { walk, status, retry } = useWalkDetail(walkId);
  const muted = { color: theme.colors.onSurfaceVariant };

  return (
    <ScreenContainer scrollable style={styles.screen} contentContainerStyle={styles.content}>
      <PrimaryButton mode="text" icon="arrow-back" onPress={onBack} style={styles.back}>
        Back
      </PrimaryButton>

      {status === "loading" ? (
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Loading walk" />
      ) : null}

      {status === "error" ? (
        <View style={styles.center}>
          <CustomText variant="titleMedium">{"Couldn't load this walk"}</CustomText>
          <PrimaryButton mode="outlined" onPress={retry}>
            Try again
          </PrimaryButton>
        </View>
      ) : null}

      {status === "ready" && walk ? (
        <>
          <View>
            <CustomText variant="headlineSmall">{walk.name || "Walk"}</CustomText>
            <CustomText variant="bodyMedium" style={muted}>
              {formatWalkTime(walk.startedAt)}
            </CustomText>
          </View>

          <Card mode="outlined">
            <Card.Content style={styles.stats}>
              {[
                { label: "Distance", value: formatWalkDistance(walk.distanceM) },
                { label: "Time", value: formatElapsed(walk.durationSec) },
                { label: "Pace (min/km)", value: formatPace(walk.durationSec, walk.distanceM) },
              ].map(({ label, value }) => (
                <View key={label} style={styles.stat}>
                  <CustomText variant="bodySmall" style={muted}>
                    {label}
                  </CustomText>
                  <CustomText variant="titleMedium">{value}</CustomText>
                </View>
              ))}
            </Card.Content>
          </Card>

          {walk.path.flat().length > 0 ? (
            <WalkPathMap segments={walk.path} />
          ) : (
            <CustomText variant="bodyMedium" style={muted}>
              No path was recorded for this walk.
            </CustomText>
          )}
        </>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 16,
  },
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  back: {
    alignSelf: "flex-start",
  },
  center: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
});
