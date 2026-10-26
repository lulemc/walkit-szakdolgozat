import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
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
            {route.walkCount === 1 ? "Walked once" : `Walked ${route.walkCount} times`}
          </CustomText>
        ) : null}
      </View>

      {route.status === "draft" ? (
        <CustomText variant="bodySmall" style={muted}>
          Generated routes are removed after 7 days unless you favourite, rename or walk it.
        </CustomText>
      ) : null}

      {full.status === "loading" ? (
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Loading the route" />
      ) : null}
      {full.status === "error" ? (
        <View style={styles.row}>
          <CustomText variant="bodyMedium" style={styles.flex}>
            {"Couldn't load the route."}
          </CustomText>
          <PrimaryButton mode="outlined" onPress={full.retry}>
            Try again
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
            label="Route name"
            accessibilityLabel="Route name"
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
              accessibilityLabel="Save"
            >
              Save
            </PrimaryButton>
            <PrimaryButton mode="outlined" onPress={() => setNewName(null)} style={styles.flex}>
              Cancel
            </PrimaryButton>
          </View>
        </View>
      ) : (
        <>
          <PrimaryButton
            icon="walk"
            onPress={() => full.route && onWalk(full.route)}
            disabled={!full.route}
            accessibilityLabel="Walk this route"
          >
            Walk this route
          </PrimaryButton>
          {onPlanGroupWalk ? (
            <PrimaryButton
              mode="outlined"
              icon="people"
              onPress={() => onPlanGroupWalk(full.route ?? route)}
            >
              Plan group walk
            </PrimaryButton>
          ) : null}
          <View style={styles.row}>
            <PrimaryButton
              mode="outlined"
              icon={route.isFavorite ? "heart" : "heart-outline"}
              onPress={() => onToggleFavorite(route)}
              style={styles.flex}
            >
              {route.isFavorite ? "Remove from favourites" : "Add to favourites"}
            </PrimaryButton>
            <PrimaryButton
              mode="outlined"
              icon="create-outline"
              onPress={() => setNewName(route.name ?? "")}
              style={styles.flex}
            >
              Rename
            </PrimaryButton>
          </View>
          <PrimaryButton
            mode="text"
            icon="trash-outline"
            textColor={theme.colors.error}
            onPress={() => setConfirmingDelete(true)}
          >
            Delete route
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
        title="Delete this route?"
        message={`Delete ${title}? Walks you saved on it stay in your history.`}
        confirmText="Delete"
        cancelText="Keep"
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
