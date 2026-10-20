import React from "react";
import { Button } from "react-native-paper";
import type { FriendRequest } from "@/types/social";
import { SocialUserRow } from "./SocialUserRow";

interface FriendRequestItemProps {
  request: FriendRequest;
  direction: "incoming" | "outgoing";
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

/** A pending request: incoming ones can be accepted or declined, outgoing ones cancelled */
export const FriendRequestItem: React.FC<FriendRequestItemProps> = ({
  request,
  direction,
  onAccept,
  onDecline,
  onCancel,
}) => {
  const { name } = request.user;

  if (direction === "outgoing") {
    return (
      <SocialUserRow name={name} subtitle="Request sent">
        <Button
          compact
          accessibilityLabel={`Cancel friend request to ${name}`}
          onPress={() => onCancel?.(request._id)}
        >
          Cancel
        </Button>
      </SocialUserRow>
    );
  }

  return (
    <SocialUserRow name={name} subtitle="Wants to be your friend">
      <Button
        compact
        mode="contained"
        accessibilityLabel={`Accept friend request from ${name}`}
        onPress={() => onAccept?.(request._id)}
      >
        Accept
      </Button>
      <Button
        compact
        accessibilityLabel={`Decline friend request from ${name}`}
        onPress={() => onDecline?.(request._id)}
      >
        Decline
      </Button>
    </SocialUserRow>
  );
};
