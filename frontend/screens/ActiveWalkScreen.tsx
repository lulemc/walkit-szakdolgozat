import { useCallback, useEffect, useRef } from "react";
import { Alert, AlertButton, BackHandler, StyleSheet, View } from "react-native";
import { CustomText } from "@/components/CustomText";
import { PrimaryButton } from "@/components/Button";
import { ActiveWalkMap } from "@/components/ActiveWalk/ActiveWalkMap";
import { WalkStatsPanel } from "@/components/ActiveWalk/WalkStatsPanel";
import { useWalkTracking } from "@/hooks/useWalkTracking";
import { routeService, type Route as RouteType } from "@/services/routeService";
import { colors } from "@/theme/colors";
import { apiErrorMessage } from "@/utils/apiError";
import { formatElapsed, formatWalkDistance } from "@/utils/walkMetrics";

interface ActiveWalkScreenProps {
  route: RouteType;
  onEndWalk: () => void;
  /** Set when walking a group walk; its route is a copy, not one of my saved routes */
  groupWalkId?: string;
}

/** Simulated GPS walks the route by itself, for testing at home */
const isMockGpsEnabled = () => process.env.EXPO_PUBLIC_USE_MOCK_GPS === "true";

export default function ActiveWalkScreen({
  route: walkRoute,
  onEndWalk,
  groupWalkId,
}: ActiveWalkScreenProps) {
  const mockGps = isMockGpsEnabled();
  const canFavorite = !groupWalkId && !walkRoute.isFavorite;

  // The latest numbers, for dialogs opened from callbacks
  const latest = useRef({ distanceM: 0, elapsedSec: 0, stop: () => {} });
  const showSummaryRef = useRef<() => void>(() => {});

  const handleReachedEnd = useCallback(() => showSummaryRef.current(), []);
  const tracking = useWalkTracking({ route: walkRoute, mockGps, onReachedEnd: handleReachedEnd });
  const { stop } = tracking;

  useEffect(() => {
    latest.current = { distanceM: tracking.distanceM, elapsedSec: tracking.elapsedSec, stop };
  }, [tracking.distanceM, tracking.elapsedSec, stop]);

  const endWalk = useCallback(() => {
    stop();
    onEndWalk();
  }, [stop, onEndWalk]);

  const saveAsFavorite = useCallback(async () => {
    stop();
    const done: AlertButton[] = [{ text: "OK", onPress: onEndWalk }];
    try {
      await routeService.addFavorite(walkRoute._id);
      Alert.alert("Saved", "The route is in your favourites now.", done);
    } catch (error) {
      Alert.alert("Couldn't save the favourite", apiErrorMessage(error), done);
    }
  }, [stop, onEndWalk, walkRoute._id]);

  useEffect(() => {
    showSummaryRef.current = () => {
      const { distanceM, elapsedSec } = latest.current;
      const buttons: AlertButton[] = [];
      if (canFavorite) buttons.push({ text: "Save as Favorite", onPress: saveAsFavorite });
      buttons.push({ text: "Finish", onPress: endWalk });
      Alert.alert(
        "Walk complete! 🎉",
        `Distance: ${formatWalkDistance(distanceM)}\nTime: ${formatElapsed(elapsedSec)}`,
        buttons,
      );
    };
  }, [canFavorite, saveAsFavorite, endWalk]);

  // Android back asks first, so a walk isn't ended by accident
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      Alert.alert("End this walk?", "The walk will end here.", [
        { text: "Keep walking", style: "cancel" },
        { text: "End walk", style: "destructive", onPress: endWalk },
      ]);
      return true;
    });
    return () => subscription.remove();
  }, [endWalk]);

  if (tracking.status === "permission-denied" || tracking.status === "error") {
    return (
      <View style={styles.centered}>
        <CustomText variant="titleMedium" style={styles.centeredText}>
          {tracking.status === "permission-denied"
            ? "Location permission is needed to track your walk."
            : "Couldn't start tracking your location."}
        </CustomText>
        <PrimaryButton mode="outlined" icon="arrow-back" onPress={onEndWalk}>
          Back
        </PrimaryButton>
      </View>
    );
  }

  const notice = mockGps
    ? "🎮 Simulated GPS (testing)"
    : tracking.status === "tracking" && !tracking.backgroundTracking
      ? "Keep the screen on: tracking stops while it's locked."
      : undefined;

  return (
    <View style={styles.container}>
      <ActiveWalkMap
        plannedRoute={walkRoute.coordinates}
        segments={tracking.segments}
        position={tracking.position}
        simulated={mockGps}
      />

      <WalkStatsPanel
        distanceM={tracking.distanceM}
        plannedDistanceM={walkRoute.totalDistance}
        elapsedSec={tracking.elapsedSec}
        notice={notice}
      />

      <View style={styles.controls}>
        <PrimaryButton
          mode="contained"
          onPress={tracking.isPaused ? tracking.resume : tracking.pause}
          style={[styles.button, styles.pauseButton]}
        >
          {tracking.isPaused ? "Resume" : "Pause"}
        </PrimaryButton>

        <PrimaryButton
          mode="contained-tonal"
          onPress={() => showSummaryRef.current()}
          style={styles.button}
        >
          Finish Walk
        </PrimaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  centeredText: {
    textAlign: "center",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  pauseButton: {
    backgroundColor: colors.error,
  },
});
