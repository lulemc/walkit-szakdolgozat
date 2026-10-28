import React, { useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText, PrimaryButton, ScreenContainer } from "@/components";
import ConfirmationModal from "@/components/ConformationModal";
import { useAuth } from "@/context/AuthProvider";
import { useGroupWalk } from "@/hooks/useGroupWalk";
import type { Route } from "@/services/routeService";
import type { GroupWalkDetail, GroupWalkParticipant, UpdateGroupWalkRequest } from "@/types/social";
import { canStartWalk, groupWalkToRoute } from "@/utils/groupWalkRoute";
import { formatWalkTime, isWalkOpen } from "@/utils/groupWalkTime";
import i18n from "@/i18n";
import { CommentsSection } from "./CommentsSection";
import { EditGroupWalkForm } from "./EditGroupWalkForm";
import { GroupWalkMap } from "./GroupWalkMap";
import { InviteFriendsForm } from "./InviteFriendsForm";
import { ParticipantList } from "./ParticipantList";
import { RespondBar } from "./RespondBar";
import { routeDetails, routeTitle } from "./savedRouteText";

type Mode = "view" | "edit" | "invite";
type Confirmation =
  | { kind: "leave" }
  | { kind: "cancel" }
  | { kind: "remove"; participant: GroupWalkParticipant };

interface GroupWalkDetailViewProps {
  walkId: string;
  onBack: () => void;
  /** Opens the walk screen with the walk's route */
  onStartWalk: (route: Route) => void;
}

/** Why I can't comment on this walk, or null when I can */
const commentsClosedReason = (walk: GroupWalkDetail): string | null => {
  if (walk.status === "cancelled") return i18n.t("social:detail.commentsClosedCancelled");
  if (walk.myStatus === "declined") return i18n.t("social:detail.commentsClosedDeclined");
  return null;
};

/**
 * A group walk: the route map, local time, note and participants. Invitees
 * answer here; the organiser edits, invites, removes people or cancels.
 * Cancelled and past walks are read-only. Everyone can comment (unless they
 * declined), and people going can start the route on the day.
 */
export const GroupWalkDetailView: React.FC<GroupWalkDetailViewProps> = ({
  walkId,
  onBack,
  onStartWalk,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(["social", "common"]);
  const { user } = useAuth();
  const groupWalk = useGroupWalk(walkId);
  const { walk } = groupWalk;
  const [mode, setMode] = useState<Mode>("view");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const backButton = (
    <PrimaryButton mode="text" icon="arrow-back" onPress={onBack} style={styles.back}>
      {t("common:actions.back")}
    </PrimaryButton>
  );

  if (!walk) {
    return (
      <ScreenContainer scrollable style={styles.screen} contentContainerStyle={styles.content}>
        {backButton}
        {groupWalk.status === "error" ? (
          <View style={styles.center}>
            <CustomText variant="titleMedium">{t("detail.loadError")}</CustomText>
            <PrimaryButton mode="outlined" onPress={groupWalk.refresh}>
              {t("common:actions.retry")}
            </PrimaryButton>
          </View>
        ) : (
          <ActivityIndicator color={theme.colors.primary} accessibilityLabel={t("detail.loading")} />
        )}
      </ScreenContainer>
    );
  }

  const name = walk.title || routeTitle(walk.route);
  const open = isWalkOpen(walk);
  const canRespond = open && !walk.isOrganiser && walk.myStatus !== null;
  const canManage = open && walk.isOrganiser;
  const canStart = canStartWalk(walk);

  // Forms return to the walk once the change went through
  const saveChanges = async (changes: UpdateGroupWalkRequest) => {
    const saved = await groupWalk.update(changes);
    if (saved) setMode("view");
    return saved;
  };
  const inviteFriends = async (userIds: string[]) => {
    const invited = await groupWalk.invite(userIds);
    if (invited) setMode("view");
    return invited;
  };

  const confirm = async () => {
    const current = confirmation;
    setConfirmation(null);
    if (current?.kind === "leave") await groupWalk.respond("declined");
    if (current?.kind === "cancel") await groupWalk.cancel();
    if (current?.kind === "remove" && current.participant.user._id) {
      await groupWalk.removeParticipant(current.participant.user._id);
    }
  };

  const actionError = groupWalk.actionError ? (
    <CustomText variant="bodySmall" style={{ color: theme.colors.error }}>
      {groupWalk.actionError}
    </CustomText>
  ) : null;

  if (mode !== "view") {
    return (
      <ScreenContainer scrollable style={styles.screen} contentContainerStyle={styles.content}>
        {mode === "edit" ? (
          <EditGroupWalkForm
            walk={walk}
            busy={groupWalk.busy}
            onSave={saveChanges}
            onCancel={() => setMode("view")}
          />
        ) : (
          <InviteFriendsForm
            walk={walk}
            busy={groupWalk.busy}
            onInvite={inviteFriends}
            onCancel={() => setMode("view")}
          />
        )}
        {actionError}
      </ScreenContainer>
    );
  }

  // On the day itself the walk can still be started, so it isn't called over yet
  const banner =
    walk.status === "cancelled"
      ? t("detail.cancelledBanner")
      : !open && !canStart
        ? t("detail.pastBanner")
        : null;
  const mutedText = { color: theme.colors.onSurfaceVariant };

  return (
    <ScreenContainer
      scrollable
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={groupWalk.refreshing}
          onRefresh={groupWalk.refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {backButton}

      {banner ? (
        <View style={[styles.banner, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Icon
            source={walk.status === "cancelled" ? "close-circle-outline" : "time-outline"}
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
          <CustomText variant="bodyMedium" style={styles.bannerText}>
            {banner}
          </CustomText>
        </View>
      ) : null}

      <View style={styles.heading}>
        <CustomText variant="headlineSmall">{name}</CustomText>
        <CustomText variant="titleMedium">{formatWalkTime(walk.scheduledAt)}</CustomText>
        <CustomText variant="bodyMedium" style={mutedText}>
          {walk.isOrganiser ? t("walks.organising") : t("walks.organisedBy", { name: walk.organiser.name })}
        </CustomText>
      </View>

      <GroupWalkMap coordinates={walk.route.coordinates} />
      <View>
        <CustomText variant="titleSmall">{routeTitle(walk.route)}</CustomText>
        <CustomText variant="bodySmall" style={mutedText}>
          {routeDetails(walk.route)}
        </CustomText>
      </View>

      {walk.note ? <CustomText variant="bodyMedium">{walk.note}</CustomText> : null}

      {canStart ? (
        <PrimaryButton icon="walk" onPress={() => onStartWalk(groupWalkToRoute(walk))}>
          {t("detail.startWalk")}
        </PrimaryButton>
      ) : null}

      {canRespond && walk.myStatus ? (
        <RespondBar
          myStatus={walk.myStatus}
          busy={groupWalk.busy}
          onAccept={() => groupWalk.respond("accepted")}
          onDecline={() => groupWalk.respond("declined")}
          onLeave={() => setConfirmation({ kind: "leave" })}
        />
      ) : null}

      {canManage ? (
        <View style={styles.organiserActions}>
          <PrimaryButton mode="outlined" icon="create-outline" onPress={() => setMode("edit")} style={styles.flex}>
            {t("common:actions.edit")}
          </PrimaryButton>
          <PrimaryButton mode="outlined" icon="person-add-outline" onPress={() => setMode("invite")} style={styles.flex}>
            {t("detail.inviteFriends")}
          </PrimaryButton>
        </View>
      ) : null}

      {actionError}

      <View>
        <CustomText variant="titleMedium">{t("detail.whosComing")}</CustomText>
        <ParticipantList
          participants={walk.participants}
          onRemove={
            canManage ? (participant) => setConfirmation({ kind: "remove", participant }) : undefined
          }
        />
      </View>

      <CommentsSection
        walkId={walk._id}
        currentUserId={user?._id}
        isOrganiser={walk.isOrganiser}
        closedReason={commentsClosedReason(walk)}
      />

      {canManage ? (
        <PrimaryButton
          mode="outlined"
          icon="trash-outline"
          textColor={theme.colors.error}
          onPress={() => setConfirmation({ kind: "cancel" })}
          disabled={groupWalk.busy}
        >
          {t("detail.cancelWalk")}
        </PrimaryButton>
      ) : null}

      <ConfirmationModal
        visible={confirmation?.kind === "leave"}
        onClose={() => setConfirmation(null)}
        onConfirm={confirm}
        title={t("detail.leaveTitle")}
        message={t("detail.leaveMessage", { name, organiser: walk.organiser.name })}
        confirmText={t("detail.leaveConfirm")}
        cancelText={t("detail.stay")}
      />
      <ConfirmationModal
        visible={confirmation?.kind === "cancel"}
        onClose={() => setConfirmation(null)}
        onConfirm={confirm}
        title={t("detail.cancelWalk")}
        message={t("detail.cancelMessage", { name })}
        confirmText={t("detail.cancelConfirm")}
        cancelText={t("detail.keepWalk")}
      />
      <ConfirmationModal
        visible={confirmation?.kind === "remove"}
        onClose={() => setConfirmation(null)}
        onConfirm={confirm}
        title={t("detail.removeTitle")}
        message={t("detail.removeMessage", {
          name: confirmation?.kind === "remove" ? confirmation.participant.user.name : "",
        })}
        confirmText={t("actions.remove")}
        cancelText={t("actions.keep")}
      />
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
  back: {
    alignSelf: "flex-start",
  },
  center: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  bannerText: {
    flex: 1,
  },
  heading: {
    gap: 4,
  },
  organiserActions: {
    flexDirection: "row",
    gap: 8,
  },
  flex: {
    flex: 1,
  },
});
