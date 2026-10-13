import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Icon, ProgressBar, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { TrendChip } from "./TrendChip";
import { colors } from "@/theme/colors";
import { calculateProgress, formatSteps } from "@/utils/healthFormatters";

interface TodayCardProps {
  steps: number;
  goal: number;
  trend: number | null;
}

export const TodayCard: React.FC<TodayCardProps> = ({ steps, goal, trend }) => {
  const theme = useTheme();
  const percent = calculateProgress(steps, goal);
  const goalReached = steps >= goal;

  return (
    <Card mode="elevated" style={{ backgroundColor: theme.colors.surface }}>
      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.labelRow}>
            <Icon source="footsteps" size={20} color={theme.colors.primary} />
            <CustomText variant="titleMedium">Today</CustomText>
          </View>
          <TrendChip value={trend} />
        </View>

        <View>
          <CustomText
            variant="displaySmall"
            style={styles.steps}
            accessibilityLabel={`${formatSteps(steps)} steps today`}
          >
            {formatSteps(steps)}
          </CustomText>
          <CustomText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            steps · goal {formatSteps(goal)}
          </CustomText>
        </View>

        <ProgressBar
          progress={percent / 100}
          color={goalReached ? colors.darkGreen : theme.colors.primary}
          style={[styles.progress, { backgroundColor: theme.colors.surfaceVariant }]}
        />
        <CustomText variant="labelLarge">
          {goalReached ? "Daily goal reached 🎉" : `${Math.round(percent)}% of your daily goal`}
        </CustomText>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  steps: {
    fontWeight: "700",
  },
  progress: {
    height: 10,
    borderRadius: 5,
  },
});
