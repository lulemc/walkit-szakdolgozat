import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CustomText, PrimaryButton } from "@/components";
import type { ParticipantStatus } from "@/types/social";

interface RespondBarProps {
  myStatus: ParticipantStatus;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  /** Leaving a walk I accepted (the screen asks for confirmation first) */
  onLeave: () => void;
}

const MESSAGE_KEYS = {
  invited: "respond.invited",
  accepted: "respond.accepted",
  declined: "respond.declined",
} as const satisfies Record<ParticipantStatus, string>;

/** An invitee's answer to a walk, and the buttons to give or change it */
export const RespondBar: React.FC<RespondBarProps> = ({
  myStatus,
  busy,
  onAccept,
  onDecline,
  onLeave,
}) => {
  const { t } = useTranslation("social");
  return (
    <View style={styles.container}>
      <CustomText variant="titleMedium">{t(MESSAGE_KEYS[myStatus])}</CustomText>
      <View style={styles.buttons}>
        {myStatus !== "accepted" ? (
          <PrimaryButton icon="checkmark" onPress={onAccept} disabled={busy} style={styles.button}>
            {t("actions.accept")}
          </PrimaryButton>
        ) : null}
        {myStatus === "invited" ? (
          <PrimaryButton mode="outlined" icon="close" onPress={onDecline} disabled={busy} style={styles.button}>
            {t("actions.decline")}
          </PrimaryButton>
        ) : null}
        {myStatus === "accepted" ? (
          <PrimaryButton mode="outlined" icon="exit-outline" onPress={onLeave} disabled={busy} style={styles.button}>
            {t("respond.leave")}
          </PrimaryButton>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
  },
});
