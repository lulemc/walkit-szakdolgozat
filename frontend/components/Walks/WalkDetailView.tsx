import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText, PrimaryButton, ScreenContainer } from "@/components";
import { useWalkDetail } from "@/hooks/useWalkDetail";
import { formatWalkTime } from "@/utils/groupWalkTime";
import { formatElapsed, formatPace, formatWalkDistance } from "@/utils/walkMetrics";
import { WalkPathMap } from "./WalkPathMap";

interface WalkDetailViewProps {
  walkId: string;
  onBack: () => void;
}

/** One saved walk: where I went, how far and how long */
export const WalkDetailView: React.FC<WalkDetailViewProps> = ({ walkId, onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation(["history", "common"]);
  const { walk, status, retry } = useWalkDetail(walkId);
  const muted = { color: theme.colors.onSurfaceVariant };

  return (
    <ScreenContainer scrollable style={styles.screen} contentContainerStyle={styles.content}>
      <PrimaryButton mode="text" icon="arrow-back" onPress={onBack} style={styles.back}>
        {t("common:actions.back")}
      </PrimaryButton>

      {status === "loading" ? (
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel={t("walk.loading")} />
      ) : null}

      {status === "error" ? (
        <View style={styles.center}>
          <CustomText variant="titleMedium">{t("walk.loadFailed")}</CustomText>
          <PrimaryButton mode="outlined" onPress={retry}>
            {t("common:actions.retry")}
          </PrimaryButton>
        </View>
      ) : null}

      {status === "ready" && walk ? (
        <>
          <View>
            <CustomText variant="headlineSmall">{walk.name || t("walk.defaultName")}</CustomText>
            <CustomText variant="bodyMedium" style={muted}>
              {formatWalkTime(walk.startedAt)}
            </CustomText>
          </View>

          <Card mode="outlined">
            <Card.Content style={styles.stats}>
              {[
                { label: t("walk.distance"), value: formatWalkDistance(walk.distanceM) },
                { label: t("walk.time"), value: formatElapsed(walk.durationSec) },
                { label: t("walk.pace"), value: formatPace(walk.durationSec, walk.distanceM) },
              ].map(({ label, value }) => (
                <View key={label} style={styles.stat}>
                  <CustomText variant="bodySmall" style={muted}>
                    {label}
                  </CustomText>
                  <CustomText variant="titleMedium">{value}</CustomText>
                </View>
              ))}
            </Card.Content>
          </Card>

          {walk.path.flat().length > 0 ? (
            <WalkPathMap segments={walk.path} />
          ) : (
            <CustomText variant="bodyMedium" style={muted}>
              {t("walk.noPath")}
            </CustomText>
          )}
        </>
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
  back: {
    alignSelf: "flex-start",
  },
  center: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
});
