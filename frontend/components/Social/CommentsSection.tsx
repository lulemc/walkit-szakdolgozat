import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText, CustomTextInput, PrimaryButton } from "@/components";
import ConfirmationModal from "@/components/ConformationModal";
import { useGroupWalkComments } from "@/hooks/useGroupWalkComments";
import type { GroupWalkComment } from "@/types/social";
import { formatWalkTime } from "@/utils/groupWalkTime";

// Same limit as the backend
const MAX_COMMENT_LENGTH = 500;

interface CommentsSectionProps {
  walkId: string;
  currentUserId?: string;
  /** The organiser can delete anyone's comment */
  isOrganiser: boolean;
  /** Why I can't comment (shown instead of the comment box), or null when I can */
  closedReason: string | null;
}

/** A group walk's comments, oldest first, with a box to write one */
export const CommentsSection: React.FC<CommentsSectionProps> = ({
  walkId,
  currentUserId,
  isOrganiser,
  closedReason,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(["social", "common"]);
  const comments = useGroupWalkComments(walkId);
  const [text, setText] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<GroupWalkComment | null>(null);
  const mutedText = { color: theme.colors.onSurfaceVariant };

  const post = async () => {
    if (await comments.add(text.trim())) setText("");
  };

  const confirmDelete = async () => {
    const comment = commentToDelete;
    setCommentToDelete(null);
    if (comment) await comments.remove(comment._id);
  };

  const renderComment = (comment: GroupWalkComment) => {
    const isMine = currentUserId !== undefined && comment.author._id === currentUserId;
    return (
      <View key={comment._id} style={styles.comment}>
        <View style={styles.commentText}>
          <View style={styles.commentHeader}>
            <CustomText variant="titleSmall">{comment.author.name}</CustomText>
            <CustomText variant="bodySmall" style={mutedText}>
              {formatWalkTime(comment.createdAt)}
            </CustomText>
          </View>
          <CustomText variant="bodyMedium">{comment.text}</CustomText>
        </View>
        {isMine || isOrganiser ? (
          <IconButton
            icon="trash-outline"
            size={20}
            accessibilityLabel={
              isMine ? t("comments.deleteMine") : t("comments.deleteOther", { name: comment.author.name })
            }
            onPress={() => setCommentToDelete(comment)}
          />
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomText variant="titleMedium">{t("comments.title")}</CustomText>

      {comments.status === "loading" ? (
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel={t("comments.loading")} />
      ) : null}

      {comments.status === "error" ? (
        <View style={styles.center}>
          <CustomText variant="bodyMedium">{t("comments.loadError")}</CustomText>
          <PrimaryButton mode="outlined" onPress={comments.reload}>
            {t("common:actions.retry")}
          </PrimaryButton>
        </View>
      ) : null}

      {comments.status === "ready" ? (
        <>
          {comments.hasOlder ? (
            <PrimaryButton
              mode="text"
              onPress={comments.loadOlder}
              loading={comments.loadingOlder}
              disabled={comments.loadingOlder}
            >
              {t("comments.loadOlder")}
            </PrimaryButton>
          ) : null}
          {comments.comments.length === 0 ? (
            <CustomText variant="bodyMedium" style={mutedText}>
              {t("comments.empty")}
            </CustomText>
          ) : null}
          {comments.comments.map(renderComment)}
        </>
      ) : null}

      {comments.actionError ? (
        <CustomText variant="bodySmall" style={{ color: theme.colors.error }}>
          {comments.actionError}
        </CustomText>
      ) : null}

      {closedReason ? (
        <CustomText variant="bodySmall" style={mutedText}>
          {closedReason}
        </CustomText>
      ) : (
        <View>
          <CustomTextInput
            label={t("comments.write")}
            accessibilityLabel={t("comments.write")}
            value={text}
            onChangeText={setText}
            maxLength={MAX_COMMENT_LENGTH}
            autoCapitalize="sentences"
            multiline
          />
          <View style={styles.composerFooter}>
            <CustomText variant="bodySmall" style={mutedText}>
              {`${text.length}/${MAX_COMMENT_LENGTH}`}
            </CustomText>
            <PrimaryButton
              icon="send"
              onPress={post}
              loading={comments.posting}
              disabled={comments.posting || text.trim().length === 0}
              accessibilityLabel={t("comments.postLabel")}
            >
              {t("comments.post")}
            </PrimaryButton>
          </View>
        </View>
      )}

      <ConfirmationModal
        visible={commentToDelete !== null}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDelete}
        title={t("comments.deleteTitle")}
        message={t("comments.deleteMessage")}
        confirmText={t("common:actions.delete")}
        cancelText={t("actions.keep")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  center: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  comment: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  commentText: {
    flex: 1,
    gap: 2,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    flexWrap: "wrap",
  },
  composerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
});
