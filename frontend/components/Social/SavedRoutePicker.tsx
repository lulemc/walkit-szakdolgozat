import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { List, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText, PrimaryButton } from "@/components";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";
import type { RouteSummary } from "@/services/routeService";
import { routeDetails, routeTitle } from "./savedRouteText";

interface SavedRoutePickerProps {
  onSelect: (route: RouteSummary) => void;
  onBack: () => void;
}

/** Choose one of my saved routes (favourites and the newest ones) for a group walk */
export const SavedRoutePicker: React.FC<SavedRoutePickerProps> = ({ onSelect, onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation(["social", "common"]);
  const { favourites, recent, status, reload: retry } = useSavedRoutes();

  const renderRoute = (route: RouteSummary) => (
    <List.Item
      key={route._id}
      title={routeTitle(route)}
      description={routeDetails(route)}
      left={(props) => (
        <List.Icon {...props} icon={route.isFavorite ? "heart" : "map-outline"} />
      )}
      right={(props) => <List.Icon {...props} icon="chevron-forward" />}
      onPress={() => onSelect(route)}
      accessibilityLabel={t("routePicker.chooseLabel", { name: routeTitle(route) })}
      accessibilityRole="button"
    />
  );

  const mutedText = { color: theme.colors.onSurfaceVariant };

  return (
    <View style={styles.container}>
      <CustomText variant="headlineSmall">{t("routePicker.title")}</CustomText>

      {status === "loading" ? (
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel={t("routePicker.loading")} />
      ) : null}

      {status === "error" ? (
        <View style={styles.center}>
          <CustomText variant="titleMedium">{t("routePicker.loadError")}</CustomText>
          <PrimaryButton mode="outlined" onPress={retry}>
            {t("common:actions.retry")}
          </PrimaryButton>
        </View>
      ) : null}

      {status === "ready" && favourites.length + recent.length === 0 ? (
        <CustomText variant="bodyMedium" style={mutedText}>
          {t("routePicker.empty")}
        </CustomText>
      ) : null}

      {status === "ready" && favourites.length > 0 ? (
        <List.Section title={t("routePicker.favourites")}>{favourites.map(renderRoute)}</List.Section>
      ) : null}

      {status === "ready" && recent.length > 0 ? (
        <List.Section title={t("routePicker.recent")}>{recent.map(renderRoute)}</List.Section>
      ) : null}

      <PrimaryButton mode="outlined" icon="arrow-back" onPress={onBack}>
        {t("common:actions.back")}
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
