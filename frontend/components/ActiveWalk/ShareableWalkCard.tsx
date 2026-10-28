import React, { forwardRef } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import Svg, { Polyline } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { CustomText } from "../CustomText";
import type { Coordinates } from "@/services/routeService";
import { pathToPolylines } from "@/utils/pathDrawing";

// The drawing's own units; the SVG scales it to the card's width
const DRAWING_WIDTH = 300;
const DRAWING_HEIGHT = 160;

export interface WalkCardStat {
  label: string;
  value: string;
  unit?: string;
}

interface ShareableWalkCardProps {
  stats: WalkCardStat[];
  segments: Coordinates[][];
  endedAt?: Date;
}

/** The walk summary as a picture: the path walked, the numbers and the date (what "Share" sends) */
export const ShareableWalkCard = forwardRef<View, ShareableWalkCardProps>(({ stats, segments, endedAt }, ref) => {
  const theme = useTheme();
  const { i18n } = useTranslation("walk");
  const lines = pathToPolylines(segments, DRAWING_WIDTH, DRAWING_HEIGHT);
  const muted = { color: theme.colors.onSurfaceVariant };

  return (
    // collapsable={false}: Android must keep this view so it can be captured
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
    >
      <View style={styles.header}>
        <CustomText variant="titleMedium" style={[styles.brand, { color: theme.colors.primary }]}>
          WalkIt
        </CustomText>
        {endedAt ? (
          <CustomText variant="bodySmall" style={muted}>
            {endedAt.toLocaleDateString(i18n.language, { year: "numeric", month: "long", day: "numeric" })}
          </CustomText>
        ) : null}
      </View>

      {lines.length > 0 ? (
        <Svg
          testID="walk-path"
          width="100%"
          height={DRAWING_HEIGHT}
          viewBox={`0 0 ${DRAWING_WIDTH} ${DRAWING_HEIGHT}`}
          accessible={false}
        >
          {lines.map((points, index) => (
            <Polyline
              key={index}
              points={points}
              fill="none"
              stroke={theme.colors.primary}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      ) : null}

      <View style={styles.stats}>
        {stats.map(({ label, value, unit }) => (
          <View key={label} style={styles.stat}>
            <CustomText variant="bodySmall" style={muted}>
              {label}
            </CustomText>
            <CustomText variant="titleLarge" style={styles.value}>
              {value}
            </CustomText>
            {unit ? (
              <CustomText variant="bodySmall" style={muted}>
                {unit}
              </CustomText>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
});

ShareableWalkCard.displayName = "ShareableWalkCard";

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  brand: {
    fontWeight: "700",
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
});
