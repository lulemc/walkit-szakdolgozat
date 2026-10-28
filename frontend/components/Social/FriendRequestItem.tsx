import React from "react";
import { Button } from "react-native-paper";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["social", "common"]);
  const { name } = request.user;

  if (direction === "outgoing") {
    return (
      <SocialUserRow name={name} subtitle={t("friends.requestSent")}>
        <Button
          compact
          accessibilityLabel={t("friends.cancelRequestLabel", { name })}
          onPress={() => onCancel?.(request._id)}
        >
          {t("common:actions.cancel")}
        </Button>
      </SocialUserRow>
    );
  }

  return (
    <SocialUserRow name={name} subtitle={t("friends.wantsToBeFriend")}>
      <Button
        compact
        mode="contained"
        accessibilityLabel={t("friends.acceptRequestLabel", { name })}
        onPress={() => onAccept?.(request._id)}
      >
        {t("actions.accept")}
      </Button>
      <Button
        compact
        accessibilityLabel={t("friends.declineRequestLabel", { name })}
        onPress={() => onDecline?.(request._id)}
      >
        {t("actions.decline")}
      </Button>
    </SocialUserRow>
  );
};
