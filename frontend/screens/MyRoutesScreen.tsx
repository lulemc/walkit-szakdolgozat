import React, { useEffect, useState } from "react";
import { BackHandler, StyleSheet } from "react-native";
import { CustomText, PrimaryButton, ScreenContainer } from "@/components";
import { SavedRouteDetail } from "@/components/Routes/SavedRouteDetail";
import { SavedRouteList } from "@/components/Routes/SavedRouteList";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";
import type { Route } from "@/services/routeService";

interface MyRoutesScreenProps {
  onBack: () => void;
  onWalk: (route: Route) => void;
  /** Leave out where there is no Social tab */
  onPlanGroupWalk?: (route: Route) => void;
}

/** My saved routes: see one on the map, walk it again, rename, favourite or delete it */
export default function MyRoutesScreen({ onBack, onWalk, onPlanGroupWalk }: MyRoutesScreenProps) {
  const saved = useSavedRoutes();
  const [openRouteId, setOpenRouteId] = useState<string | null>(null);
  // From the lists, so it shows the latest name and favourite state
  const openRoute = [...saved.favourites, ...saved.recent].find((route) => route._id === openRouteId);

  // Android back: from a route to the list, from the list to the planner
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (openRouteId) setOpenRouteId(null);
      else onBack();
      return true;
    });
    return () => subscription.remove();
  }, [openRouteId, onBack]);

  const deleteOpenRoute = async () => {
    if (openRouteId && (await saved.remove(openRouteId))) setOpenRouteId(null);
  };

  return (
    <ScreenContainer scrollable style={styles.screen} contentContainerStyle={styles.content}>
      <PrimaryButton
        mode="text"
        icon="arrow-back"
        onPress={openRoute ? () => setOpenRouteId(null) : onBack}
        style={styles.back}
      >
        Back
      </PrimaryButton>

      {openRoute ? (
        <SavedRouteDetail
          route={openRoute}
          actionError={saved.actionError}
          onWalk={onWalk}
          onPlanGroupWalk={onPlanGroupWalk}
          onToggleFavorite={saved.toggleFavorite}
          onRename={(name) => saved.rename(openRoute._id, name)}
          onDelete={deleteOpenRoute}
        />
      ) : (
        <>
          <CustomText variant="headlineSmall">My routes</CustomText>
          <SavedRouteList
            favourites={saved.favourites}
            recent={saved.recent}
            status={saved.status}
            onOpen={(route) => setOpenRouteId(route._id)}
            onRetry={saved.reload}
          />
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 16,
  },
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  back: {
    alignSelf: "flex-start",
  },
});
