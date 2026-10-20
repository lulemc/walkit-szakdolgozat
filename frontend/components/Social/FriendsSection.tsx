import React, { ReactNode, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { CustomText, CustomTextInput, PrimaryButton, ScreenContainer } from "@/components";
import ConfirmationModal from "@/components/ConformationModal";
import { useFriends } from "@/hooks/useFriends";
import { useUserSearch } from "@/hooks/useUserSearch";
import type { Friend, UserSearchResult } from "@/types/social";
import { FriendListItem } from "./FriendListItem";
import { FriendRequestItem } from "./FriendRequestItem";
import { UserSearchResultItem } from "./UserSearchResultItem";

interface FriendsSectionProps {
  /** Shown at the top of the scrolling content (e.g. the Social hub's title and switch) */
  header?: ReactNode;
}

/** Search people, handle friend requests and see or remove friends */
export const FriendsSection: React.FC<FriendsSectionProps> = ({ header }) => {
  const theme = useTheme();
  const friends = useFriends();
  const search = useUserSearch();
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);

  const handleAdd = async (result: UserSearchResult) => {
    const friendship = await friends.sendRequest(result._id);
    if (friendship) {
      search.updateResult(result._id, {
        relationship: friendship.status === "accepted" ? "friends" : "outgoing",
        friendshipId: friendship._id,
      });
    }
  };

  const handleAcceptFromSearch = async (result: UserSearchResult) => {
    if (!result.friendshipId) return;
    if (await friends.accept(result.friendshipId)) {
      search.updateResult(result._id, { relationship: "friends" });
    }
  };

  const confirmRemove = async () => {
    const friend = friendToRemove;
    setFriendToRemove(null);
    if (friend?.user._id) await friends.unfriend(friend.user._id);
  };

  const { incoming, outgoing } = friends.requests;
  const mutedText = { color: theme.colors.onSurfaceVariant };

  return (
    <ScreenContainer
      scrollable
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={friends.refreshing}
          onRefresh={friends.refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {header}

      <View>
        <CustomTextInput
          label="Search by name or email"
          accessibilityLabel="Search by name or email"
          value={search.query}
          onChangeText={search.setQuery}
          autoCorrect={false}
          left={<TextInput.Icon icon="search" />}
        />
        {search.searching ? <ActivityIndicator color={theme.colors.primary} /> : null}
        {search.error ? (
          <CustomText custom="error" variant="bodySmall">
            {search.error}
          </CustomText>
        ) : null}
        {search.results.map((result) => (
          <UserSearchResultItem
            key={result._id}
            result={result}
            onAdd={handleAdd}
            onAccept={handleAcceptFromSearch}
          />
        ))}
      </View>

      {friends.actionError ? (
        <CustomText custom="error" variant="bodySmall" style={styles.center}>
          {friends.actionError}
        </CustomText>
      ) : null}

      {friends.status === "loading" ? (
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Loading friends" />
      ) : null}

      {friends.status === "error" ? (
        <View style={styles.errorBox}>
          <CustomText variant="titleMedium">{"Couldn't load your friends"}</CustomText>
          <PrimaryButton mode="outlined" onPress={friends.refresh}>
            Try again
          </PrimaryButton>
        </View>
      ) : null}

      {friends.status === "ready" ? (
        <>
          <View>
            <CustomText variant="titleMedium">Requests</CustomText>
            {incoming.length + outgoing.length === 0 ? (
              <CustomText variant="bodyMedium" style={mutedText}>
                No pending requests.
              </CustomText>
            ) : null}
            {incoming.map((request) => (
              <FriendRequestItem
                key={request._id}
                request={request}
                direction="incoming"
                onAccept={friends.accept}
                onDecline={friends.decline}
              />
            ))}
            {outgoing.map((request) => (
              <FriendRequestItem
                key={request._id}
                request={request}
                direction="outgoing"
                onCancel={friends.cancel}
              />
            ))}
          </View>

          <View>
            <CustomText variant="titleMedium">Friends</CustomText>
            {friends.friends.length === 0 ? (
              <CustomText variant="bodyMedium" style={mutedText}>
                No friends yet. Search above to add someone.
              </CustomText>
            ) : null}
            {friends.friends.map((friend) => (
              <FriendListItem key={friend.friendshipId} friend={friend} onUnfriend={setFriendToRemove} />
            ))}
          </View>
        </>
      ) : null}

      <ConfirmationModal
        visible={friendToRemove !== null}
        onClose={() => setFriendToRemove(null)}
        onConfirm={confirmRemove}
        title="Remove friend"
        message={`Remove ${friendToRemove?.user.name ?? ""} from your friends?`}
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
  center: {
    textAlign: "center",
  },
  errorBox: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
});
