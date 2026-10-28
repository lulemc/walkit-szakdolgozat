import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText, PrimaryButton, ScreenContainer } from "@/components";
import { formatElapsed, formatPace, formatWalkDistance } from "@/utils/walkMetrics";
import type { Coordinates } from "@/services/routeService";
import { shareWalkImage, SharingUnavailableError } from "@/services/shareWalk";
import { ShareableWalkCard } from "./ShareableWalkCard";

export type FavoriteState = "hidden" | "available" | "saving" | "saved";

interface WalkSummaryViewProps {
  distanceM: number;
  elapsedSec: number;
  saving: boolean;
  /** Why saving or favouriting failed, if it did */
  error: string | null;
  favorite: FavoriteState;
  onSave: () => void;
  onDiscard: () => void;
  onFavorite: () => void;
  /** The path walked, one array per stretch between pauses (drawn on the shared picture) */
  segments?: Coordinates[][];
  endedAt?: Date;
}

/** After a walk: what was walked, and whether to keep it */
export const WalkSummaryView: React.FC<WalkSummaryViewProps> = ({
  distanceM,
  elapsedSec,
  saving,
  error,
  favorite,
  onSave,
  onDiscard,
  onFavorite,
  segments = [],
  endedAt,
}) => {
  const theme = useTheme();
  const { t } = useTranslation("walk");
  const card = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const stats = [
    { label: t("stats.distance"), value: formatWalkDistance(distanceM) },
    { label: t("stats.time"), value: formatElapsed(elapsedSec) },
    { label: t("stats.pace"), value: formatPace(elapsedSec, distanceM), unit: t("stats.paceUnit") },
  ];

  const share = async () => {
    setSharing(true);
    setShareError(null);
    try {
      await shareWalkImage(card, t("share.dialogTitle"));
    } catch (shareFailure) {
      setShareError(shareFailure instanceof SharingUnavailableError ? t("share.unavailable") : t("share.failed"));
    } finally {
      setSharing(false);
    }
  };

  return (
    <ScreenContainer scrollable style={styles.screen} contentContainerStyle={styles.content}>
      <CustomText variant="headlineMedium" style={styles.title}>
        {t("summary.title")}
      </CustomText>

      <ShareableWalkCard ref={card} stats={stats} segments={segments} endedAt={endedAt} />

      <PrimaryButton mode="outlined" icon="share-social-outline" onPress={share} loading={sharing} disabled={sharing}>
        {t("share.button")}
      </PrimaryButton>
      {shareError ? (
        <CustomText variant="bodySmall" style={[styles.center, { color: theme.colors.error }]}>
          {shareError}
        </CustomText>
      ) : null}

      {favorite !== "hidden" ? (
        <PrimaryButton
          mode="outlined"
          icon={favorite === "saved" ? "heart" : "heart-outline"}
          onPress={onFavorite}
          loading={favorite === "saving"}
          disabled={favorite !== "available"}
        >
          {favorite === "saved" ? t("summary.inFavourites") : t("summary.addToFavourites")}
        </PrimaryButton>
      ) : null}

      {error ? (
        <CustomText variant="bodySmall" style={[styles.center, { color: theme.colors.error }]}>
          {error}
        </CustomText>
      ) : null}

      <PrimaryButton icon="save-outline" onPress={onSave} loading={saving} disabled={saving}>
        {t("summary.save")}
      </PrimaryButton>
      <PrimaryButton mode="text" onPress={onDiscard} disabled={saving} textColor={theme.colors.error}>
        {t("summary.discard")}
      </PrimaryButton>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 24,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: 16,
  },
  title: {
    textAlign: "center",
  },
  center: {
    textAlign: "center",
  },
});
