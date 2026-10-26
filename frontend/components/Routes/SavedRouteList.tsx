import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { List, useTheme } from "react-native-paper";
import { CustomText, PrimaryButton } from "@/components";
import { routeDetails, routeTitle } from "@/components/Social/savedRouteText";
import type { SavedRoutesStatus } from "@/hooks/useSavedRoutes";
import type { RouteSummary } from "@/services/routeService";

interface SavedRouteListProps {
  favourites: RouteSummary[];
  recent: RouteSummary[];
  status: SavedRoutesStatus;
  onOpen: (route: RouteSummary) => void;
  onRetry: () => void;
}

/** My favourite routes and the newest other routes */
export const SavedRouteList: React.FC<SavedRouteListProps> = ({
  favourites,
  recent,
  status,
  onOpen,
  onRetry,
}) => {
  const theme = useTheme();

  const renderRoute = (route: RouteSummary) => (
    <List.Item
      key={route._id}
      title={routeTitle(route)}
      description={routeDetails(route)}
      left={(props) => <List.Icon {...props} icon={route.isFavorite ? "heart" : "map-outline"} />}
      right={(props) => <List.Icon {...props} icon="chevron-forward" />}
      onPress={() => onOpen(route)}
      accessibilityLabel={`Open ${routeTitle(route)}`}
      accessibilityRole="button"
    />
  );

  if (status === "loading") {
    return <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Loading routes" />;
  }

  if (status === "error") {
    return (
      <View style={styles.center}>
        <CustomText variant="titleMedium">{"Couldn't load your routes"}</CustomText>
        <PrimaryButton mode="outlined" onPress={onRetry}>
          Try again
        </PrimaryButton>
      </View>
    );
  }

  if (favourites.length + recent.length === 0) {
    return (
      <CustomText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        No saved routes yet. Every route you generate on the planner is saved here.
      </CustomText>
    );
  }

  return (
    <View>
      {favourites.length > 0 ? (
        <List.Section title="Favourites">{favourites.map(renderRoute)}</List.Section>
      ) : null}
      {recent.length > 0 ? <List.Section title="Recent">{recent.map(renderRoute)}</List.Section> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
});
