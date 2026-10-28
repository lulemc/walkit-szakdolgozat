import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, BackHandler, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CustomText } from "@/components/CustomText";
import { PrimaryButton } from "@/components/Button";
import { ActiveWalkMap } from "@/components/ActiveWalk/ActiveWalkMap";
import { WalkStatsPanel } from "@/components/ActiveWalk/WalkStatsPanel";
import { FavoriteState, WalkSummaryView } from "@/components/ActiveWalk/WalkSummaryView";
import { useWalkTracking } from "@/hooks/useWalkTracking";
import { routeService, type Coordinates, type Route as RouteType } from "@/services/routeService";
import { walkService } from "@/services/walkService";
import { colors } from "@/theme/colors";
import { apiErrorMessage } from "@/utils/apiError";

interface ActiveWalkScreenProps {
  route: RouteType;
  onEndWalk: () => void;
  /** Set when walking a group walk; its route is a copy, not one of my saved routes */
  groupWalkId?: string;
}

interface FinishedWalk {
  startedAt: Date;
  endedAt: Date;
  distanceM: number;
  elapsedSec: number;
  segments: Coordinates[][];
}

/** Simulated GPS walks the route by itself, for testing at home */
const isMockGpsEnabled = () => process.env.EXPO_PUBLIC_USE_MOCK_GPS === "true";

export default function ActiveWalkScreen({
  route: walkRoute,
  onEndWalk,
  groupWalkId,
}: ActiveWalkScreenProps) {
  const { t } = useTranslation(["walk", "common"]);
  const mockGps = isMockGpsEnabled();
  const canFavorite = !groupWalkId && !walkRoute.isFavorite;

  // Set when the walk has ended: the numbers to show and save
  const [finished, setFinished] = useState<FinishedWalk | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState<FavoriteState>(canFavorite ? "available" : "hidden");

  // finish() is also called from the tracking hook, so it reads the latest numbers from a ref
  const finishRef = useRef<() => void>(() => {});
  const handleReachedEnd = useCallback(() => finishRef.current(), []);
  const tracking = useWalkTracking({ route: walkRoute, mockGps, onReachedEnd: handleReachedEnd });
  const { stop, distanceM, elapsedSec, segments } = tracking;

  useEffect(() => {
    finishRef.current = () => {
      const { startedAt, endedAt } = stop();
      setFinished({ startedAt, endedAt, distanceM, elapsedSec, segments });
    };
  }, [stop, distanceM, elapsedSec, segments]);

  const save = async () => {
    if (!finished) return;
    setSaving(true);
    setError(null);
    try {
      await walkService.record({
        // A group walk's route is a copy, so it's linked by the group walk instead
        ...(groupWalkId ? { groupWalkId } : { routeId: walkRoute._id }),
        startedAt: finished.startedAt.toISOString(),
        endedAt: finished.endedAt.toISOString(),
        durationSec: finished.elapsedSec,
        distanceM: finished.distanceM,
        path: finished.segments.filter((segment) => segment.length > 0),
      });
      onEndWalk();
    } catch (saveError) {
      setError(apiErrorMessage(saveError));
      setSaving(false);
    }
  };

  const addToFavorites = async () => {
    setFavorite("saving");
    setError(null);
    try {
      await routeService.addFavorite(walkRoute._id);
      setFavorite("saved");
    } catch (favoriteError) {
      setError(apiErrorMessage(favoriteError));
      setFavorite("available");
    }
  };

  const confirmDiscard = useCallback(() => {
    Alert.alert(t("discardDialog.title"), t("discardDialog.message"), [
      { text: t("discardDialog.keep"), style: "cancel" },
      { text: t("discardDialog.discard"), style: "destructive", onPress: onEndWalk },
    ]);
  }, [onEndWalk, t]);

  // Android back asks first: during the walk whether to end it, afterwards whether to discard it
  const hasFinished = finished !== null;
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (hasFinished) {
        confirmDiscard();
      } else {
        Alert.alert(t("endDialog.title"), t("endDialog.message"), [
          { text: t("endDialog.keepWalking"), style: "cancel" },
          { text: t("endDialog.end"), onPress: () => finishRef.current() },
        ]);
      }
      return true;
    });
    return () => subscription.remove();
  }, [hasFinished, confirmDiscard, t]);

  if (finished) {
    return (
      <WalkSummaryView
        distanceM={finished.distanceM}
        elapsedSec={finished.elapsedSec}
        saving={saving}
        error={error}
        favorite={favorite}
        onSave={save}
        onDiscard={confirmDiscard}
        onFavorite={addToFavorites}
        segments={finished.segments}
        endedAt={finished.endedAt}
      />
    );
  }

  if (tracking.status === "permission-denied" || tracking.status === "error") {
    return (
      <View style={styles.centered}>
        <CustomText variant="titleMedium" style={styles.centeredText}>
          {tracking.status === "permission-denied"
            ? t("permissionDenied")
            : t("trackingFailed")}
        </CustomText>
        <PrimaryButton mode="outlined" icon="arrow-back" onPress={onEndWalk}>
          {t("common:actions.back")}
        </PrimaryButton>
      </View>
    );
  }

  const notice = mockGps
    ? t("simulatedGps")
    : tracking.status === "tracking" && !tracking.backgroundTracking
      ? t("keepScreenOn")
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
          {tracking.isPaused ? t("resume") : t("pause")}
        </PrimaryButton>

        <PrimaryButton
          mode="contained-tonal"
          onPress={() => finishRef.current()}
          style={styles.button}
        >
          {t("finish")}
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
