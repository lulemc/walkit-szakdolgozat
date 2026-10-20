import React from "react";
import { Button } from "react-native-paper";
import type { Friend } from "@/types/social";
import { SocialUserRow } from "./SocialUserRow";

interface FriendListItemProps {
  friend: Friend;
  onUnfriend: (friend: Friend) => void;
}

export const FriendListItem: React.FC<FriendListItemProps> = ({ friend, onUnfriend }) => (
  <SocialUserRow
    name={friend.user.name}
    subtitle={`Friends since ${new Date(friend.since).toLocaleDateString()}`}
  >
    <Button
      compact
      accessibilityLabel={`Remove ${friend.user.name} from friends`}
      onPress={() => onUnfriend(friend)}
    >
      Unfriend
    </Button>
  </SocialUserRow>
);
