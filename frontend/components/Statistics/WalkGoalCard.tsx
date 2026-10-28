import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Dialog, HelperText, Portal, ProgressBar, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText } from "../CustomText";
import { CustomTextInput } from "../Inputs/CustomTextInput";
import { parseGoalKm } from "@/utils/walkGoals";

interface WalkGoalCardProps {
  goalKm: number;
  thisWeekM: number;
  streak: number;
  /** Rejects if the goal couldn't be saved */
  onSaveGoal: (km: number) => Promise<void>;
}

/** km with at most one decimal, e.g. 4.2 */
const km = (metres: number) => String(Math.round(metres / 100) / 10);

/** This week's distance towards the weekly goal, and the streak of weeks with a walk */
export const WalkGoalCard: React.FC<WalkGoalCardProps> = ({ goalKm, thisWeekM, streak, onSaveGoal }) => {
  const theme = useTheme();
  const { t } = useTranslation(["statistics", "common"]);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const progress = Math.min(thisWeekM / (goalKm * 1000), 1);
  const progressText = t("goal.progress", { done: km(thisWeekM), goal: String(goalKm) });
  const streakText = streak > 0 ? t("goal.streak", { count: streak }) : t("goal.noStreak");

  const openEditor = () => {
    setText(String(goalKm));
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    const goal = parseGoalKm(text);
    if (goal === null) {
      setError(t("goal.invalid"));
      return;
    }
    setSaving(true);
    try {
      await onSaveGoal(goal);
      setEditing(false);
    } catch {
      setError(t("goal.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card mode="outlined">
      <Card.Content
        style={styles.content}
        accessible
        accessibilityLabel={t("goal.summaryLabel", {
          progress: progressText,
          percent: Math.round(progress * 100),
          streak: streak > 0 ? t("goal.streakLabel", { count: streak }) : t("goal.noStreak"),
        })}
      >
        <View style={styles.header}>
          <CustomText variant="titleSmall">{t("goal.title")}</CustomText>
          <CustomText variant="titleMedium" style={{ color: theme.colors.primary }}>
            {progressText}
          </CustomText>
        </View>
        <ProgressBar progress={progress} color={theme.colors.primary} style={styles.bar} />
        <CustomText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {progress >= 1 ? t("goal.reached") : streakText}
        </CustomText>
        {progress >= 1 && streak > 0 ? (
          <CustomText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {streakText}
          </CustomText>
        ) : null}
      </Card.Content>
      <Card.Actions>
        <Button onPress={openEditor}>{t("goal.change")}</Button>
      </Card.Actions>

      <Portal>
        <Dialog visible={editing} onDismiss={() => setEditing(false)}>
          <Dialog.Title>{t("goal.title")}</Dialog.Title>
          <Dialog.Content>
            <CustomTextInput
              label={t("goal.inputLabel")}
              value={text}
              onChangeText={setText}
              keyboardType="decimal-pad"
              error={error !== null}
            />
            <HelperText type="error" visible={error !== null}>
              {error ?? ""}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditing(false)}>{t("common:actions.cancel")}</Button>
            <Button onPress={save} loading={saving} disabled={saving}>
              {t("common:actions.save")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Card>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 8,
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
});
