import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { CustomText, PrimaryButton } from "@/components";
import { groupWalkService } from "@/services/groupWalkService";
import type { Route } from "@/services/routeService";
import type { CreateGroupWalkRequest, GroupWalkDetail } from "@/types/social";
import { apiErrorMessage } from "@/utils/apiError";
import { FriendMultiSelect } from "./FriendMultiSelect";
import { routeDetails, routeTitle } from "./savedRouteText";
import { WalkTextFields } from "./WalkTextFields";
import { futureTimeError, WalkTimeFields } from "./WalkTimeFields";

interface CreateGroupWalkFormProps {
  route: Route;
  onCreated: (walk: GroupWalkDetail) => void;
  onCancel: () => void;
  /** Shows a "Change route" button */
  onChangeRoute?: () => void;
}

/** Tomorrow at 9:00 local time, a sensible first suggestion */
const defaultStartTime = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
};

/** Schedule a group walk on a route: title, note, date and time, and who to invite */
export const CreateGroupWalkForm: React.FC<CreateGroupWalkFormProps> = ({
  route,
  onCreated,
  onCancel,
  onChangeRoute,
}) => {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultStartTime);
  const [inviteeIds, setInviteeIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): string[] => {
    const problems: string[] = [];
    const timeError = futureTimeError(scheduledAt);
    if (timeError) problems.push(timeError);
    if (inviteeIds.length === 0) problems.push("Invite at least one friend.");
    return problems;
  };

  const handleSubmit = async () => {
    const problems = validate();
    setErrors(problems);
    if (problems.length > 0) return;

    const request: CreateGroupWalkRequest = {
      routeId: route._id,
      // Sent in UTC; everyone sees it in their own time zone
      scheduledAt: scheduledAt.toISOString(),
      inviteeIds,
    };
    if (title.trim()) request.title = title.trim();
    if (note.trim()) request.note = note.trim();

    setSubmitting(true);
    try {
      const walk = await groupWalkService.create(request);
      onCreated(walk);
    } catch (error) {
      setErrors([apiErrorMessage(error)]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomText variant="headlineSmall">Plan a group walk</CustomText>

      <Card mode="outlined">
        <Card.Title
          title={routeTitle(route)}
          subtitle={routeDetails(route)}
          subtitleNumberOfLines={2}
        />
        {onChangeRoute ? (
          <Card.Actions>
            <PrimaryButton mode="text" onPress={onChangeRoute}>
              Change route
            </PrimaryButton>
          </Card.Actions>
        ) : null}
      </Card>

      <WalkTextFields
        title={title}
        note={note}
        onTitleChange={setTitle}
        onNoteChange={setNote}
      />

      <WalkTimeFields value={scheduledAt} onChange={setScheduledAt} />

      <View>
        <CustomText variant="titleMedium">Invite friends</CustomText>
        <FriendMultiSelect selectedIds={inviteeIds} onChange={setInviteeIds} />
      </View>

      {errors.map((error) => (
        <CustomText key={error} variant="bodySmall" style={{ color: theme.colors.error }}>
          {error}
        </CustomText>
      ))}

      <PrimaryButton
        icon="people"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        accessibilityLabel="Create group walk"
      >
        Create group walk
      </PrimaryButton>
      <PrimaryButton mode="outlined" onPress={onCancel} disabled={submitting}>
        Cancel
      </PrimaryButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 32,
  },
});
