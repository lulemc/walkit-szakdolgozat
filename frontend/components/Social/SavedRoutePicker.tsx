import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { List, useTheme } from "react-native-paper";
import { CustomText, PrimaryButton } from "@/components";
import { useAuth } from "@/context/AuthProvider";
import { Route, routeService } from "@/services/routeService";
import { routeDetails, routeTitle } from "./savedRouteText";

/** How many of the newest routes are offered besides the favourites */
export const RECENT_ROUTE_LIMIT = 10;

type LoadStatus = "loading" | "ready" | "error";

interface SavedRoutePickerProps {
  onSelect: (route: Route) => void;
  onBack: () => void;
}

/** Choose one of my saved routes (favourites and the newest ones) for a group walk */
export const SavedRoutePicker: React.FC<SavedRoutePickerProps> = ({ onSelect, onBack }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const userId = user?._id;
  const [favourites, setFavourites] = useState<Route[]>([]);
  const [recent, setRecent] = useState<Route[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");

  // State is only updated in the promise callbacks, after the requests finished
  const load = useCallback(() => {
    if (!userId) return Promise.resolve();
    return Promise.all([routeService.getFavoriteRoutes(), routeService.getUserRoutes(userId)]).then(
      ([loadedFavourites, loadedRoutes]) => {
        const favouriteIds = new Set(loadedFavourites.map((route) => route._id));
        setFavourites(loadedFavourites);
        setRecent(
          loadedRoutes.filter((route) => !favouriteIds.has(route._id)).slice(0, RECENT_ROUTE_LIMIT),
        );
        setStatus("ready");
      },
      () => setStatus("error"),
    );
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setStatus("loading");
    load();
  };

  const renderRoute = (route: Route) => (
    <List.Item
      key={route._id}
      title={routeTitle(route)}
      description={routeDetails(route)}
      left={(props) => (
        <List.Icon {...props} icon={route.isFavorite ? "heart" : "map-outline"} />
      )}
      right={(props) => <List.Icon {...props} icon="chevron-forward" />}
      onPress={() => onSelect(route)}
      accessibilityLabel={`Choose ${routeTitle(route)}`}
      accessibilityRole="button"
    />
  );

  const mutedText = { color: theme.colors.onSurfaceVariant };

  return (
    <View style={styles.container}>
      <CustomText variant="headlineSmall">Choose a route</CustomText>

      {status === "loading" ? (
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Loading routes" />
      ) : null}

      {status === "error" ? (
        <View style={styles.center}>
          <CustomText variant="titleMedium">{"Couldn't load your routes"}</CustomText>
          <PrimaryButton mode="outlined" onPress={retry}>
            Try again
          </PrimaryButton>
        </View>
      ) : null}

      {status === "ready" && favourites.length + recent.length === 0 ? (
        <CustomText variant="bodyMedium" style={mutedText}>
          No saved routes yet. Generate one on the Home tab, then plan a group walk with it.
        </CustomText>
      ) : null}

      {status === "ready" && favourites.length > 0 ? (
        <List.Section title="Favourites">{favourites.map(renderRoute)}</List.Section>
      ) : null}

      {status === "ready" && recent.length > 0 ? (
        <List.Section title="Recent">{recent.map(renderRoute)}</List.Section>
      ) : null}

      <PrimaryButton mode="outlined" icon="arrow-back" onPress={onBack}>
        Back
      </PrimaryButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 32,
  },
  center: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
});
