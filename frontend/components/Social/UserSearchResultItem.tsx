import React from "react";
import { Button } from "react-native-paper";
import { useTranslation } from "react-i18next";
import type { UserSearchResult } from "@/types/social";
import { SocialUserRow } from "./SocialUserRow";

interface UserSearchResultItemProps {
  result: UserSearchResult;
  onAdd: (result: UserSearchResult) => void;
  onAccept: (result: UserSearchResult) => void;
}

/** A person found by search, with the action that fits our relationship */
export const UserSearchResultItem: React.FC<UserSearchResultItemProps> = ({
  result,
  onAdd,
  onAccept,
}) => {
  const { t } = useTranslation("social");
  const { name, relationship } = result;

  const button = {
    none: (
      <Button compact mode="contained" accessibilityLabel={t("search.addLabel", { name })} onPress={() => onAdd(result)}>
        {t("search.add")}
      </Button>
    ),
    outgoing: (
      <Button compact disabled accessibilityLabel={t("search.requestedLabel", { name })}>
        {t("search.requested")}
      </Button>
    ),
    incoming: (
      <Button
        compact
        mode="contained"
        accessibilityLabel={t("search.acceptLabel", { name })}
        onPress={() => onAccept(result)}
      >
        {t("actions.accept")}
      </Button>
    ),
    friends: (
      <Button compact disabled accessibilityLabel={t("search.friendsLabel", { name })}>
        {t("search.friends")}
      </Button>
    ),
  }[relationship];

  return <SocialUserRow name={name}>{button}</SocialUserRow>;
};
