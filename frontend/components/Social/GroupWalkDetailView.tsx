import React, { useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText, PrimaryButton, ScreenContainer } from "@/components";
import ConfirmationModal from "@/components/ConformationModal";
import { useGroupWalk } from "@/hooks/useGroupWalk";
import type { GroupWalkParticipant, UpdateGroupWalkRequest } from "@/types/social";
import { formatWalkTime, isWalkOpen } from "@/utils/groupWalkTime";
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
}

/**
 * A group walk: the route map, local time, note and participants. Invitees
 * answer here; the organiser edits, invites, removes people or cancels.
 * Cancelled and past walks are read-only.
 */
export const GroupWalkDetailView: React.FC<GroupWalkDetailViewProps> = ({ walkId, onBack }) => {
  const theme = useTheme();
  const groupWalk = useGroupWalk(walkId);
  const { walk } = groupWalk;
  const [mode, setMode] = useState<Mode>("view");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const backButton = (
    <PrimaryButton mode="text" icon="arrow-back" onPress={onBack} style={styles.back}>
      Back
    </PrimaryButton>
  );

  if (!walk) {
    return (
      <ScreenContainer scrollable style={styles.screen} contentContainerStyle={styles.content}>
        {backButton}
        {groupWalk.status === "error" ? (
          <View style={styles.center}>
            <CustomText variant="titleMedium">{"Couldn't load this walk"}</CustomText>
            <PrimaryButton mode="outlined" onPress={groupWalk.refresh}>
              Try again
            </PrimaryButton>
          </View>
        ) : (
          <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Loading group walk" />
        )}
      </ScreenContainer>
    );
  }

  const name = walk.title || routeTitle(walk.route);
  const open = isWalkOpen(walk);
  const canRespond = open && !walk.isOrganiser && walk.myStatus !== null;
  const canManage = open && walk.isOrganiser;

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

  const banner =
    walk.status === "cancelled"
      ? "This walk was cancelled."
      : !open
        ? "This walk has already taken place."
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
          {walk.isOrganiser ? "You're organising" : `Organised by ${walk.organiser.name}`}
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
            Edit
          </PrimaryButton>
          <PrimaryButton mode="outlined" icon="person-add-outline" onPress={() => setMode("invite")} style={styles.flex}>
            Invite friends
          </PrimaryButton>
        </View>
      ) : null}

      {actionError}

      <View>
        <CustomText variant="titleMedium">Who&apos;s coming</CustomText>
        <ParticipantList
          participants={walk.participants}
          onRemove={
            canManage ? (participant) => setConfirmation({ kind: "remove", participant }) : undefined
          }
        />
      </View>

      {canManage ? (
        <PrimaryButton
          mode="outlined"
          icon="trash-outline"
          textColor={theme.colors.error}
          onPress={() => setConfirmation({ kind: "cancel" })}
          disabled={groupWalk.busy}
        >
          Cancel walk
        </PrimaryButton>
      ) : null}

      <ConfirmationModal
        visible={confirmation?.kind === "leave"}
        onClose={() => setConfirmation(null)}
        onConfirm={confirm}
        title="Leave walk"
        message={`Leave ${name}? ${walk.organiser.name} will see that you're not coming.`}
        confirmText="Yes, leave"
        cancelText="Stay"
      />
      <ConfirmationModal
        visible={confirmation?.kind === "cancel"}
        onClose={() => setConfirmation(null)}
        onConfirm={confirm}
        title="Cancel walk"
        message={`Cancel ${name} for everyone? This can't be undone.`}
        confirmText="Yes, cancel it"
        cancelText="Keep walk"
      />
      <ConfirmationModal
        visible={confirmation?.kind === "remove"}
        onClose={() => setConfirmation(null)}
        onConfirm={confirm}
        title="Remove participant"
        message={`Remove ${confirmation?.kind === "remove" ? confirmation.participant.user.name : ""} from the walk?`}
        confirmText="Remove"
        cancelText="Keep"
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
