import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { CustomText } from "@/components/CustomText";
import {
  formatElapsed,
  formatPace,
  formatWalkDistance,
} from "@/utils/walkMetrics";

interface WalkStatsPanelProps {
  distanceM: number;
  plannedDistanceM: number;
  elapsedSec: number;
  /** A line above the numbers, e.g. that simulated GPS is on */
  notice?: string;
}

/** Distance, time and pace of the walk so far */
export const WalkStatsPanel: React.FC<WalkStatsPanelProps> = ({
  distanceM,
  plannedDistanceM,
  elapsedSec,
  notice,
}) => {
  const theme = useTheme();
  const muted = { color: theme.colors.onSurfaceVariant };
  const value = { color: theme.colors.onSurface };

  return (
  <Card style={styles.card}>
    <Card.Content>
      {/* One sentence for screen readers instead of nine separate numbers and labels */}
      <View
        accessible
        accessibilityLabel={`Walked ${formatWalkDistance(distanceM)} of ${formatWalkDistance(
          plannedDistanceM,
        )} in ${formatElapsed(elapsedSec)}, pace ${formatPace(elapsedSec, distanceM)} minutes per kilometre`}
      >
        {notice ? (
          <View style={[styles.notice, { backgroundColor: theme.colors.secondaryContainer }]}>
            <CustomText style={[styles.noticeText, { color: theme.colors.onSecondaryContainer }]}>{notice}</CustomText>
          </View>
        ) : null}

        <View style={styles.grid}>
          <View style={styles.item}>
            <CustomText variant="bodySmall" style={[styles.label, muted]}>
              Distance
            </CustomText>
            <CustomText variant="titleLarge" style={[styles.value, value]}>
              {formatWalkDistance(distanceM)}
            </CustomText>
            <CustomText variant="bodySmall" style={[styles.subtext, muted]}>
              / {formatWalkDistance(plannedDistanceM)}
            </CustomText>
          </View>

          <View style={styles.item}>
            <CustomText variant="bodySmall" style={[styles.label, muted]}>
              Time
            </CustomText>
            <CustomText variant="titleLarge" style={[styles.value, value]}>
              {formatElapsed(elapsedSec)}
            </CustomText>
          </View>

          <View style={styles.item}>
            <CustomText variant="bodySmall" style={[styles.label, muted]}>
              Pace
            </CustomText>
            <CustomText variant="titleLarge" style={[styles.value, value]}>
              {formatPace(elapsedSec, distanceM)}
            </CustomText>
            <CustomText variant="bodySmall" style={[styles.subtext, muted]}>
              min/km
            </CustomText>
          </View>
        </View>
      </View>
    </Card.Content>
  </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 12,
  },
  notice: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  noticeText: {
    textAlign: "center",
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    marginBottom: 4,
  },
  value: {
    fontWeight: "700",
  },
  subtext: {
    fontSize: 10,
  },
});
