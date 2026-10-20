import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { CustomDatePicker, CustomText, CustomTextInput, PrimaryButton } from "@/components";
import { groupWalkService } from "@/services/groupWalkService";
import type { Route } from "@/services/routeService";
import type { CreateGroupWalkRequest, GroupWalkDetail } from "@/types/social";
import { apiErrorMessage } from "@/utils/apiError";
import { FriendMultiSelect } from "./FriendMultiSelect";
import { routeDetails, routeTitle } from "./savedRouteText";

// Same limits as the backend
const TITLE_MAX_LENGTH = 80;
const NOTE_MAX_LENGTH = 500;

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

  // The date and time pickers each change only their part of the walk's time
  const handleDateChange = (picked: Date) => {
    const next = new Date(scheduledAt);
    next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    setScheduledAt(next);
  };

  const handleTimeChange = (picked: Date) => {
    const next = new Date(scheduledAt);
    next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    setScheduledAt(next);
  };

  const validate = (): string[] => {
    const problems: string[] = [];
    if (scheduledAt.getTime() <= Date.now()) problems.push("Pick a time in the future.");
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

      <View>
        <CustomTextInput
          label="Title (optional)"
          accessibilityLabel="Title (optional)"
          value={title}
          onChangeText={setTitle}
          maxLength={TITLE_MAX_LENGTH}
          autoCapitalize="sentences"
        />
        <CustomTextInput
          label="Note (optional)"
          accessibilityLabel="Note (optional)"
          value={note}
          onChangeText={setNote}
          maxLength={NOTE_MAX_LENGTH}
          autoCapitalize="sentences"
          multiline
        />
      </View>

      <View style={styles.when}>
        <CustomDatePicker
          testID="group-walk-date"
          label="Date"
          value={scheduledAt}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
        <CustomDatePicker
          testID="group-walk-time"
          mode="time"
          label="Time"
          value={scheduledAt}
          onChange={handleTimeChange}
        />
      </View>

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
  when: {
    gap: 12,
  },
});
