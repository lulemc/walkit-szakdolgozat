import React from "react";
import { View } from "react-native";
import { Chip, IconButton } from "react-native-paper";
import type { GroupWalkParticipant } from "@/types/social";
import { PARTICIPANT_STATUS_LABELS } from "./groupWalkLabels";
import { SocialUserRow } from "./SocialUserRow";

interface ParticipantListProps {
  participants: GroupWalkParticipant[];
  /** Shows a remove button next to each invitee (for the organiser of an open walk) */
  onRemove?: (participant: GroupWalkParticipant) => void;
}

const statusLabel = (participant: GroupWalkParticipant) =>
  participant.role === "organiser" ? "Organiser" : PARTICIPANT_STATUS_LABELS[participant.status];

/** Everyone in a group walk with their answer */
export const ParticipantList: React.FC<ParticipantListProps> = ({ participants, onRemove }) => (
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
          accessibilityLabel={`${user.name}, ${label}`}
        >
          <Chip compact>{label}</Chip>
          {removable ? (
            <IconButton
              icon="person-remove-outline"
              accessibilityLabel={`Remove ${user.name} from the walk`}
              onPress={() => onRemove(participant)}
            />
          ) : null}
        </SocialUserRow>
      );
    })}
  </View>
);
