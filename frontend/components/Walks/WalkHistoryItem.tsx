import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Chip, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText } from "../CustomText";
import type { WalkSummary } from "@/types/walk";
import { formatWalkTime } from "@/utils/groupWalkTime";
import { formatElapsed, formatWalkDistance } from "@/utils/walkMetrics";

interface WalkHistoryItemProps {
  walk: WalkSummary;
  onPress: (walkId: string) => void;
}

/** One walk in the history: name, local start time, distance and time */
export const WalkHistoryItem: React.FC<WalkHistoryItemProps> = ({ walk, onPress }) => {
  const theme = useTheme();
  const { t } = useTranslation("history");
  const name = walk.name || t("walk.defaultName");
  const time = formatWalkTime(walk.startedAt);
  const numbers = `${formatWalkDistance(walk.distanceM)} · ${formatElapsed(walk.durationSec)}`;
  const label = [
    name,
    time,
    formatWalkDistance(walk.distanceM),
    formatElapsed(walk.durationSec),
    walk.groupWalkId ? t("walk.groupWalk") : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Card
      mode="outlined"
      onPress={() => onPress(walk._id)}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Card.Content style={styles.content}>
        <View style={styles.text}>
          <CustomText variant="titleMedium">{name}</CustomText>
          <CustomText variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {time}
          </CustomText>
          <CustomText variant="bodyMedium">{numbers}</CustomText>
        </View>
        {walk.groupWalkId ? <Chip compact>{t("walk.groupWalk")}</Chip> : null}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
