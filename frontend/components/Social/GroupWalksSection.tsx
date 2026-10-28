import React, { ReactNode } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText, PrimaryButton, ScreenContainer } from "@/components";
import { useAuth } from "@/context/AuthProvider";
import { useGroupWalks } from "@/hooks/useGroupWalks";
import type { GroupWalkSummary } from "@/types/social";
import { GroupWalkCard } from "./GroupWalkCard";

interface GroupWalksSectionProps {
  /** Shown at the top of the scrolling content (e.g. the Social hub's title and switch) */
  header?: ReactNode;
  onOpenWalk: (walkId: string) => void;
  onNewWalk: () => void;
}

/** My walk invitations, upcoming walks and past walks */
export const GroupWalksSection: React.FC<GroupWalksSectionProps> = ({
  header,
  onOpenWalk,
  onNewWalk,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(["social", "common"]);
  const { user } = useAuth();
  const walks = useGroupWalks();
  const mutedText = { color: theme.colors.onSurfaceVariant };

  const renderList = (list: GroupWalkSummary[], emptyMessage: string) =>
    list.length === 0 ? (
      <CustomText variant="bodyMedium" style={mutedText}>
        {emptyMessage}
      </CustomText>
    ) : (
      list.map((walk) => (
        <GroupWalkCard key={walk._id} walk={walk} currentUserId={user?._id} onPress={onOpenWalk} />
      ))
    );

  return (
    <ScreenContainer
      scrollable
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={walks.refreshing}
          onRefresh={walks.refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {header}

      <PrimaryButton icon="add" onPress={onNewWalk}>
        {t("walks.newWalk")}
      </PrimaryButton>

      {walks.status === "loading" ? (
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel={t("walks.loading")} />
      ) : null}

      {walks.status === "error" ? (
        <View style={styles.errorBox}>
          <CustomText variant="titleMedium">{t("walks.loadError")}</CustomText>
          <PrimaryButton mode="outlined" onPress={walks.refresh}>
            {t("common:actions.retry")}
          </PrimaryButton>
        </View>
      ) : null}

      {walks.status === "ready" ? (
        <>
          {walks.invitations.length > 0 ? (
            <View style={styles.list}>
              <CustomText variant="titleMedium">{t("walks.invitations")}</CustomText>
              {renderList(walks.invitations, "")}
            </View>
          ) : null}

          <View style={styles.list}>
            <CustomText variant="titleMedium">{t("walks.upcoming")}</CustomText>
            {renderList(walks.upcoming, t("walks.noUpcoming"))}
          </View>

          <View style={styles.list}>
            <CustomText variant="titleMedium">{t("walks.past")}</CustomText>
            {renderList(walks.past, t("walks.noPast"))}
          </View>
        </>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 16,
  },
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  list: {
    gap: 8,
  },
  errorBox: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
});
