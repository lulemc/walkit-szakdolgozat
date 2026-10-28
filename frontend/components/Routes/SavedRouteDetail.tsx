import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText, CustomTextInput, PrimaryButton } from "@/components";
import ConfirmationModal from "@/components/ConformationModal";
import { GroupWalkMap } from "@/components/Social/GroupWalkMap";
import { routeDetails, routeTitle } from "@/components/Social/savedRouteText";
import { useFullRoute } from "@/hooks/useFullRoute";
import type { Route, RouteSummary } from "@/services/routeService";

interface SavedRouteDetailProps {
  /** From the list; the whole route (for the map and walking) is loaded here */
  route: RouteSummary;
  actionError: string | null;
  onWalk: (route: Route) => void;
  /** Shows "Plan group walk"; leave out where there is no Social tab */
  onPlanGroupWalk?: (route: RouteSummary) => void;
  onToggleFavorite: (route: RouteSummary) => void;
  /** Resolves with whether renaming worked */
  onRename: (name: string) => Promise<boolean>;
  onDelete: () => void;
}

/** One saved route on a map, with what can be done with it */
export const SavedRouteDetail: React.FC<SavedRouteDetailProps> = ({
  route,
  actionError,
  onWalk,
  onPlanGroupWalk,
  onToggleFavorite,
  onRename,
  onDelete,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(["history", "common"]);
  const full = useFullRoute(route._id);
  const [newName, setNewName] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const muted = { color: theme.colors.onSurfaceVariant };
  const title = routeTitle(route);

  const saveName = async () => {
    if (!newName?.trim()) return;
    setRenaming(true);
    const renamed = await onRename(newName.trim());
    setRenaming(false);
    if (renamed) setNewName(null);
  };

  return (
    <View style={styles.container}>
      <View>
        <CustomText variant="headlineSmall">{title}</CustomText>
        <CustomText variant="bodyMedium" style={muted}>
          {routeDetails(route)}
        </CustomText>
        {route.walkCount > 0 ? (
          <CustomText variant="bodySmall" style={muted}>
            {t("routes.walked", { count: route.walkCount })}
          </CustomText>
        ) : null}
      </View>

      {route.status === "draft" ? (
        <CustomText variant="bodySmall" style={muted}>
          {t("routes.draftNotice")}
        </CustomText>
      ) : null}

      {full.status === "loading" ? (
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel={t("routes.loadingRoute")} />
      ) : null}
      {full.status === "error" ? (
        <View style={styles.row}>
          <CustomText variant="bodyMedium" style={styles.flex}>
            {t("routes.routeLoadFailed")}
          </CustomText>
          <PrimaryButton mode="outlined" onPress={full.retry}>
            {t("common:actions.retry")}
          </PrimaryButton>
        </View>
      ) : null}
      {full.route ? <GroupWalkMap coordinates={full.route.coordinates} /> : null}

      {actionError ? (
        <CustomText variant="bodySmall" style={{ color: theme.colors.error }}>
          {actionError}
        </CustomText>
      ) : null}

      {newName !== null ? (
        <View style={styles.rename}>
          <CustomTextInput
            label={t("routes.name")}
            accessibilityLabel={t("routes.name")}
            value={newName}
            onChangeText={setNewName}
            maxLength={100}
            autoCapitalize="sentences"
          />
          <View style={styles.row}>
            <PrimaryButton
              onPress={saveName}
              loading={renaming}
              disabled={renaming || !newName.trim()}
              style={styles.flex}
              accessibilityLabel={t("common:actions.save")}
            >
              {t("common:actions.save")}
            </PrimaryButton>
            <PrimaryButton mode="outlined" onPress={() => setNewName(null)} style={styles.flex}>
              {t("common:actions.cancel")}
            </PrimaryButton>
          </View>
        </View>
      ) : (
        <>
          <PrimaryButton
            icon="walk"
            onPress={() => full.route && onWalk(full.route)}
            disabled={!full.route}
            accessibilityLabel={t("routes.walk")}
          >
            {t("routes.walk")}
          </PrimaryButton>
          {onPlanGroupWalk ? (
            <PrimaryButton
              mode="outlined"
              icon="people"
              onPress={() => onPlanGroupWalk(full.route ?? route)}
            >
              {t("routes.planGroupWalk")}
            </PrimaryButton>
          ) : null}
          <View style={styles.row}>
            <PrimaryButton
              mode="outlined"
              icon={route.isFavorite ? "heart" : "heart-outline"}
              onPress={() => onToggleFavorite(route)}
              style={styles.flex}
            >
              {route.isFavorite ? t("routes.removeFavourite") : t("routes.addFavourite")}
            </PrimaryButton>
            <PrimaryButton
              mode="outlined"
              icon="create-outline"
              onPress={() => setNewName(route.name ?? "")}
              style={styles.flex}
            >
              {t("routes.rename")}
            </PrimaryButton>
          </View>
          <PrimaryButton
            mode="text"
            icon="trash-outline"
            textColor={theme.colors.error}
            onPress={() => setConfirmingDelete(true)}
          >
            {t("routes.delete")}
          </PrimaryButton>
        </>
      )}

      <ConfirmationModal
        visible={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          onDelete();
        }}
        title={t("routes.deleteTitle")}
        message={t("routes.deleteMessage", { name: title })}
        confirmText={t("common:actions.delete")}
        cancelText={t("routes.keep")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  rename: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  flex: {
    flex: 1,
  },
});
