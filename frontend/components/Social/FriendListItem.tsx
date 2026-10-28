import React from "react";
import { Button } from "react-native-paper";
import { useTranslation } from "react-i18next";
import type { Friend } from "@/types/social";
import { SocialUserRow } from "./SocialUserRow";

interface FriendListItemProps {
  friend: Friend;
  onUnfriend: (friend: Friend) => void;
}

export const FriendListItem: React.FC<FriendListItemProps> = ({ friend, onUnfriend }) => {
  const { t, i18n } = useTranslation("social");
  return (
    <SocialUserRow
      name={friend.user.name}
      subtitle={t("friends.since", { date: new Date(friend.since).toLocaleDateString(i18n.language) })}
    >
      <Button
        compact
        accessibilityLabel={t("friends.unfriendLabel", { name: friend.user.name })}
        onPress={() => onUnfriend(friend)}
      >
        {t("friends.unfriend")}
      </Button>
    </SocialUserRow>
  );
};
