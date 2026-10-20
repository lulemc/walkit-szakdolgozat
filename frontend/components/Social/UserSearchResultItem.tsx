import React from "react";
import { Button } from "react-native-paper";
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
  const { name, relationship } = result;

  const button = {
    none: (
      <Button compact mode="contained" accessibilityLabel={`Add ${name} as a friend`} onPress={() => onAdd(result)}>
        Add
      </Button>
    ),
    outgoing: (
      <Button compact disabled accessibilityLabel={`Friend request to ${name} already sent`}>
        Requested
      </Button>
    ),
    incoming: (
      <Button
        compact
        mode="contained"
        accessibilityLabel={`Accept ${name}'s friend request`}
        onPress={() => onAccept(result)}
      >
        Accept
      </Button>
    ),
    friends: (
      <Button compact disabled accessibilityLabel={`${name} is already your friend`}>
        Friends
      </Button>
    ),
  }[relationship];

  return <SocialUserRow name={name}>{button}</SocialUserRow>;
};
