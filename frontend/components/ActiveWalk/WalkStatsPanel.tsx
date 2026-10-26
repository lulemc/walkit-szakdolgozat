import React from "react";
import { StyleSheet, View } from "react-native";
import { Card } from "react-native-paper";
import { CustomText } from "@/components/CustomText";
import { colors } from "@/theme/colors";
import { formatElapsed, formatPace, formatWalkDistance } from "@/utils/walkMetrics";

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
}) => (
  <Card style={styles.card}>
    <Card.Content>
      {notice ? (
        <View style={styles.notice}>
          <CustomText style={styles.noticeText}>{notice}</CustomText>
        </View>
      ) : null}

      <View style={styles.grid}>
        <View style={styles.item}>
          <CustomText variant="bodySmall" style={styles.label}>
            Distance
          </CustomText>
          <CustomText variant="titleLarge" style={styles.value}>
            {formatWalkDistance(distanceM)}
          </CustomText>
          <CustomText variant="bodySmall" style={styles.subtext}>
            / {formatWalkDistance(plannedDistanceM)}
          </CustomText>
        </View>

        <View style={styles.item}>
          <CustomText variant="bodySmall" style={styles.label}>
            Time
          </CustomText>
          <CustomText variant="titleLarge" style={styles.value}>
            {formatElapsed(elapsedSec)}
          </CustomText>
        </View>

        <View style={styles.item}>
          <CustomText variant="bodySmall" style={styles.label}>
            Pace
          </CustomText>
          <CustomText variant="titleLarge" style={styles.value}>
            {formatPace(elapsedSec, distanceM)}
          </CustomText>
          <CustomText variant="bodySmall" style={styles.subtext}>
            min/km
          </CustomText>
        </View>
      </View>
    </Card.Content>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 12,
  },
  notice: {
    backgroundColor: colors.beige,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  noticeText: {
    textAlign: "center",
    color: colors.secondary,
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
    color: "#6B7280",
    marginBottom: 4,
  },
  value: {
    fontWeight: "700",
    color: colors.beige,
  },
  subtext: {
    color: colors.grey,
    fontSize: 10,
  },
});
