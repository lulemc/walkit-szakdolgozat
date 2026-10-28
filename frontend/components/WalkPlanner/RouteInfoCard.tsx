import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { CustomText } from "@/components/CustomText";
import { PrimaryButton } from "@/components/Button";
import { useTranslation } from "react-i18next";
import { Route, RoutePreferences, routeService } from "@/services/routeService";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

interface RouteInfoCardProps {
  route: Route;
  onClose: () => void;
  onStartWalk: () => void;
  /** Shows a "Plan group walk" button; leave out where group walks aren't available */
  onPlanGroupWalk?: (route: Route) => void;
}

// The order the active preferences are listed in
const CHIP_ORDER: (keyof RoutePreferences)[] = [
  "parks",
  "waterfront",
  "scenic",
  "uphill",
  "mountain",
  "quietStreets",
  "beach",
  "avoidHighways",
];

const RouteInfoCard: React.FC<RouteInfoCardProps> = ({
  route,
  onClose,
  onStartWalk,
  onPlanGroupWalk,
}) => {
  const theme = useTheme();
  const { t } = useTranslation("planner");
  const muted = { color: theme.colors.onSurfaceVariant };
  const chipColors = { backgroundColor: theme.colors.surfaceVariant };
  const divider = { backgroundColor: theme.colors.outlineVariant };
  const distance = routeService.formatDistance(route.totalDistance);
  const duration = routeService.formatDuration(route.estimatedDuration);
  const pace = routeService.calculatePace(
    route.totalDistance,
    route.estimatedDuration,
  );
  const elevationGain = routeService.formatElevation(route.elevationGain);
  const elevationLoss = routeService.formatElevation(route.elevationLoss);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.primary;
    if (score >= 60) return colors.error;
    return colors.grey;
  };

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CustomText variant="titleMedium" style={styles.title}>
              {t("routeInfo.title")}
            </CustomText>
            <View
              style={[
                styles.scoreBadge,
                { backgroundColor: getScoreColor(route.preferenceScore) },
              ]}
            >
              <CustomText style={styles.scoreText}>
                {route.preferenceScore}/100
              </CustomText>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t("routeInfo.close")}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons name="close-circle" size={28} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <CustomText style={styles.statIcon}>📏</CustomText>
            <CustomText variant="bodySmall" style={[styles.statLabel, muted]}>
              {t("routeInfo.distance")}
            </CustomText>
            <CustomText variant="titleMedium" style={styles.statValue}>
              {distance}
            </CustomText>
          </View>

          <View style={styles.statItem}>
            <CustomText style={styles.statIcon}>⏱️</CustomText>
            <CustomText variant="bodySmall" style={[styles.statLabel, muted]}>
              {t("routeInfo.duration")}
            </CustomText>
            <CustomText variant="titleMedium" style={styles.statValue}>
              {duration}
            </CustomText>
          </View>

          <View style={styles.statItem}>
            <CustomText style={styles.statIcon}>⚡</CustomText>
            <CustomText variant="bodySmall" style={[styles.statLabel, muted]}>
              {t("routeInfo.pace")}
            </CustomText>
            <CustomText variant="titleMedium" style={styles.statValue}>
              {pace}
            </CustomText>
          </View>
        </View>

        {(route.elevationGain > 0 || route.elevationLoss > 0) && (
          <View style={styles.elevationSection}>
            <View style={[styles.divider, divider]} />
            <CustomText variant="bodyMedium" style={styles.elevationTitle}>
              {t("routeInfo.elevation")}
            </CustomText>
            <View style={styles.elevationGrid}>
              <View style={styles.elevationItem}>
                <CustomText style={styles.elevationIcon}>↗️</CustomText>
                <CustomText variant="bodySmall" style={[styles.elevationLabel, muted]}>
                  {t("routeInfo.gain")}
                </CustomText>
                <CustomText variant="titleSmall" style={styles.elevationValue}>
                  {elevationGain}
                </CustomText>
              </View>
              <View style={styles.elevationItem}>
                <CustomText style={styles.elevationIcon}>↘️</CustomText>
                <CustomText variant="bodySmall" style={[styles.elevationLabel, muted]}>
                  {t("routeInfo.loss")}
                </CustomText>
                <CustomText variant="titleSmall" style={styles.elevationValue}>
                  {elevationLoss}
                </CustomText>
              </View>
            </View>
          </View>
        )}

        {Object.values(route.preferences).some((v) => v) && (
          <>
            <View style={[styles.divider, divider]} />
            <View style={styles.preferencesSection}>
              <CustomText variant="bodySmall" style={[styles.preferencesLabel, muted]}>
                {t("routeInfo.activePreferences")}
              </CustomText>
              <View style={styles.preferenceChips}>
                {CHIP_ORDER.filter((key) => route.preferences[key]).map((key) => (
                  <View key={key} style={[styles.chip, chipColors]}>
                    <CustomText style={[styles.chipText, muted]}>{t(`routeInfo.chips.${key}`)}</CustomText>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={[styles.divider, divider]} />
        <PrimaryButton
          mode="contained"
          onPress={onStartWalk}
          style={styles.startButton}
          icon="walk"
        >
          {t("routeInfo.startWalk")}
        </PrimaryButton>
        {onPlanGroupWalk && (
          <PrimaryButton
            mode="outlined"
            onPress={() => onPlanGroupWalk(route)}
            style={styles.groupWalkButton}
            icon="people"
          >
            {t("routeInfo.planGroupWalk")}
          </PrimaryButton>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  title: {
    fontWeight: "600",
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  closeButton: {
    borderRadius: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    marginBottom: 4,
  },
  statValue: {
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  elevationSection: {
    marginTop: 4,
  },
  elevationTitle: {
    marginBottom: 8,
    fontWeight: "500",
  },
  elevationGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  elevationItem: {
    alignItems: "center",
  },
  elevationIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  elevationLabel: {
    marginBottom: 2,
  },
  elevationValue: {
    fontWeight: "600",
  },
  preferencesSection: {
    marginTop: 4,
  },
  preferencesLabel: {
    marginBottom: 8,
  },
  preferenceChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
  },
  startButton: {
    marginTop: 4,
  },
  groupWalkButton: {
    marginTop: 8,
  },
});

export default RouteInfoCard;
