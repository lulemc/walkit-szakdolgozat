import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText, PrimaryButton } from "@/components";
import type { GroupWalkDetail } from "@/types/social";
import { FriendMultiSelect } from "./FriendMultiSelect";

interface InviteFriendsFormProps {
  walk: GroupWalkDetail;
  busy: boolean;
  /** Resolves with whether inviting worked */
  onInvite: (userIds: string[]) => Promise<boolean>;
  onCancel: () => void;
}

/** The organiser invites more friends; people who declined can be asked again */
export const InviteFriendsForm: React.FC<InviteFriendsFormProps> = ({
  walk,
  busy,
  onInvite,
  onCancel,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(["social", "common"]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const alreadyIn = walk.participants
    .filter((participant) => participant.status !== "declined" && participant.user._id)
    .map((participant) => participant.user._id as string);

  const handleInvite = async () => {
    if (selectedIds.length === 0) {
      setError(t("invite.pickOne"));
      return;
    }
    setError(null);
    await onInvite(selectedIds);
  };

  return (
    <View style={styles.container}>
      <CustomText variant="headlineSmall">{t("invite.title")}</CustomText>
      <FriendMultiSelect selectedIds={selectedIds} onChange={setSelectedIds} excludeIds={alreadyIn} />
      {error ? (
        <CustomText variant="bodySmall" style={{ color: theme.colors.error }}>
          {error}
        </CustomText>
      ) : null}
      <PrimaryButton icon="send" onPress={handleInvite} loading={busy} disabled={busy}>
        {t("invite.send")}
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
