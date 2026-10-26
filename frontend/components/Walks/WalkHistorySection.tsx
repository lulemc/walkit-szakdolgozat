import React from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { CustomText, PrimaryButton, ScreenContainer } from "@/components";
import { useWalkHistory } from "@/hooks/useWalkHistory";
import { useWalkStats } from "@/hooks/useWalkStats";
import { WalkHistoryItem } from "./WalkHistoryItem";
import { WalkTotalsCard } from "./WalkTotalsCard";

interface WalkHistorySectionProps {
  onOpenWalk: (walkId: string) => void;
}

/** This week's totals and every walk I saved, newest first */
export const WalkHistorySection: React.FC<WalkHistorySectionProps> = ({ onOpenWalk }) => {
  const theme = useTheme();
  const history = useWalkHistory();
  const { stats } = useWalkStats();

  return (
    <ScreenContainer
      scrollable
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={history.refreshing}
          onRefresh={history.refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {stats ? <WalkTotalsCard title="This week" stats={stats} /> : null}

      {history.status === "loading" ? (
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Loading walks" />
      ) : null}

      {history.status === "error" ? (
        <View style={styles.center}>
          <CustomText variant="titleMedium">{"Couldn't load your walks"}</CustomText>
          <PrimaryButton mode="outlined" onPress={history.refresh}>
            Try again
          </PrimaryButton>
        </View>
      ) : null}

      {history.status === "ready" ? (
        <View style={styles.list}>
          <CustomText variant="titleMedium">Recent walks</CustomText>
          {history.walks.length === 0 ? (
            <CustomText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No walks yet. Walk a route from the Home tab and save it at the end.
            </CustomText>
          ) : null}
          {history.walks.map((walk) => (
            <WalkHistoryItem key={walk._id} walk={walk} onPress={onOpenWalk} />
          ))}
          {history.hasMore ? (
            <PrimaryButton
              mode="text"
              onPress={history.loadMore}
              loading={history.loadingMore}
              disabled={history.loadingMore}
            >
              Load more
            </PrimaryButton>
          ) : null}
        </View>
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
  center: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
});
