import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Chip, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText } from "../CustomText";
import type { GroupWalkSummary } from "@/types/social";
import { formatWalkTime } from "@/utils/groupWalkTime";
import { countsLabel, participantStatusLabel } from "./groupWalkLabels";
import { routeTitle } from "./savedRouteText";

interface GroupWalkCardProps {
  walk: GroupWalkSummary;
  /** The logged-in user, to tell the walks they organise */
  currentUserId?: string;
  onPress: (walkId: string) => void;
}

/** One group walk in a list: name, local time, organiser, who's coming and my status */
export const GroupWalkCard: React.FC<GroupWalkCardProps> = ({ walk, currentUserId, onPress }) => {
  const theme = useTheme();
  const { t } = useTranslation("social");
  const name = walk.title || routeTitle(walk.route);
  const time = formatWalkTime(walk.scheduledAt);
  const organiser =
    currentUserId && walk.organiser._id === currentUserId
      ? t("walks.organising")
      : t("walks.organisedBy", { name: walk.organiser.name });
  const counts = countsLabel(walk.counts);
  const badge =
    walk.status === "cancelled"
      ? t("walks.cancelled")
      : walk.myStatus
        ? participantStatusLabel(walk.myStatus)
        : null;
  const mutedText = { color: theme.colors.onSurfaceVariant };

  return (
    <Card
      mode="outlined"
      onPress={() => onPress(walk._id)}
      accessibilityRole="button"
      accessibilityLabel={[name, time, organiser, counts, badge].filter(Boolean).join(", ")}
    >
      <Card.Content style={styles.content}>
        <View style={styles.text}>
          <CustomText
            variant="titleMedium"
            style={walk.status === "cancelled" ? styles.cancelled : undefined}
          >
            {name}
          </CustomText>
          <CustomText variant="bodyMedium">{time}</CustomText>
          <CustomText variant="bodySmall" style={mutedText}>
            {organiser} · {counts}
          </CustomText>
        </View>
        {badge ? <Chip compact>{badge}</Chip> : null}
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
  cancelled: {
    textDecorationLine: "line-through",
  },
});
