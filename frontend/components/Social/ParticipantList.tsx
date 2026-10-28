import React from "react";
import { View } from "react-native";
import { Chip, IconButton } from "react-native-paper";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import type { GroupWalkParticipant } from "@/types/social";
import { participantStatusLabel } from "./groupWalkLabels";
import { SocialUserRow } from "./SocialUserRow";

interface ParticipantListProps {
  participants: GroupWalkParticipant[];
  /** Shows a remove button next to each invitee (for the organiser of an open walk) */
  onRemove?: (participant: GroupWalkParticipant) => void;
}

const statusLabel = (participant: GroupWalkParticipant) =>
  participant.role === "organiser"
    ? i18n.t("social:status.organiser")
    : participantStatusLabel(participant.status);

/** Everyone in a group walk with their answer */
export const ParticipantList: React.FC<ParticipantListProps> = ({ participants, onRemove }) => {
  const { t } = useTranslation("social");
  return (
    <View>
      {participants.map((participant, index) => {
        const { user } = participant;
        const label = statusLabel(participant);
        // Deleted accounts have no id, so they can't be removed
        const removable = onRemove && participant.role === "invitee" && user._id;
        return (
          <SocialUserRow
            key={user._id ?? `deleted-${index}`}
            name={user.name}
            accessibilityLabel={t("participants.rowLabel", { name: user.name, status: label })}
          >
            <Chip compact>{label}</Chip>
            {removable ? (
              <IconButton
                icon="person-remove-outline"
                accessibilityLabel={t("participants.removeLabel", { name: user.name })}
                onPress={() => onRemove(participant)}
              />
            ) : null}
          </SocialUserRow>
        );
      })}
    </View>
  );
};
