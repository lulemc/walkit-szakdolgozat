import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Checkbox, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText, PrimaryButton } from "@/components";
import { friendService } from "@/services/friendService";
import type { Friend } from "@/types/social";

type LoadStatus = "loading" | "ready" | "error";

interface FriendMultiSelectProps {
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  /** Friends not to offer, e.g. people already in the walk */
  excludeIds?: string[];
}

/** Tick the friends to invite to a group walk */
export const FriendMultiSelect: React.FC<FriendMultiSelectProps> = ({
  selectedIds,
  onChange,
  excludeIds = [],
}) => {
  const theme = useTheme();
  const { t } = useTranslation(["social", "common"]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");

  // State is only updated in the promise callbacks, after the request finished
  const load = useCallback(
    () =>
      friendService.listFriends().then(
        (loaded) => {
          // Deleted accounts can't be invited
          setFriends(loaded.filter((friend) => friend.user._id));
          setStatus("ready");
        },
        () => setStatus("error"),
      ),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setStatus("loading");
    load();
  };

  const toggle = (userId: string) =>
    onChange(
      selectedIds.includes(userId)
        ? selectedIds.filter((id) => id !== userId)
        : [...selectedIds, userId],
    );

  if (status === "loading") {
    return <ActivityIndicator color={theme.colors.primary} accessibilityLabel={t("friends.loading")} />;
  }

  if (status === "error") {
    return (
      <View style={styles.center}>
        <CustomText variant="titleMedium">{t("friends.loadError")}</CustomText>
        <PrimaryButton mode="outlined" onPress={retry}>
          {t("common:actions.retry")}
        </PrimaryButton>
      </View>
    );
  }

  const offered = friends.filter((friend) => !excludeIds.includes(friend.user._id as string));
  if (offered.length === 0) {
    return (
      <CustomText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {friends.length === 0
          ? t("friendPicker.noFriends")
          : t("friendPicker.allInvited")}
      </CustomText>
    );
  }

  return (
    <View>
      {offered.map(({ friendshipId, user }) => {
        const userId = user._id as string;
        return (
          <Checkbox.Item
            key={friendshipId}
            label={user.name}
            accessibilityLabel={t("friendPicker.inviteLabel", { name: user.name })}
            status={selectedIds.includes(userId) ? "checked" : "unchecked"}
            onPress={() => toggle(userId)}
            position="leading"
            labelStyle={styles.label}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  label: {
    textAlign: "left",
  },
});
