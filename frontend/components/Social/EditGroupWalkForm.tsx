import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText, PrimaryButton } from "@/components";
import type { GroupWalkDetail, UpdateGroupWalkRequest } from "@/types/social";
import { WalkTextFields } from "./WalkTextFields";
import { futureTimeError, WalkTimeFields } from "./WalkTimeFields";

interface EditGroupWalkFormProps {
  walk: GroupWalkDetail;
  busy: boolean;
  /** Resolves with whether saving worked */
  onSave: (changes: UpdateGroupWalkRequest) => Promise<boolean>;
  onCancel: () => void;
}

/** The organiser changes a walk's title, note or time; answers so far are kept */
export const EditGroupWalkForm: React.FC<EditGroupWalkFormProps> = ({
  walk,
  busy,
  onSave,
  onCancel,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(["social", "common"]);
  const [title, setTitle] = useState(walk.title ?? "");
  const [note, setNote] = useState(walk.note ?? "");
  const [scheduledAt, setScheduledAt] = useState(() => new Date(walk.scheduledAt));
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const changes: UpdateGroupWalkRequest = { title: title.trim(), note: note.trim() };
    // The time is only sent when it changed, so an unchanged time isn't checked again
    if (scheduledAt.getTime() !== new Date(walk.scheduledAt).getTime()) {
      const timeError = futureTimeError(scheduledAt);
      setError(timeError);
      if (timeError) return;
      changes.scheduledAt = scheduledAt.toISOString();
    }
    await onSave(changes);
  };

  return (
    <View style={styles.container}>
      <CustomText variant="headlineSmall">{t("form.editTitle")}</CustomText>
      <WalkTextFields title={title} note={note} onTitleChange={setTitle} onNoteChange={setNote} />
      <WalkTimeFields value={scheduledAt} onChange={setScheduledAt} />
      {error ? (
        <CustomText variant="bodySmall" style={{ color: theme.colors.error }}>
          {error}
        </CustomText>
      ) : null}
      <PrimaryButton icon="save-outline" onPress={handleSave} loading={busy} disabled={busy}>
        {t("common:actions.save")}
      </PrimaryButton>
      <PrimaryButton mode="outlined" onPress={onCancel} disabled={busy}>
        {t("common:actions.cancel")}
      </PrimaryButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});
