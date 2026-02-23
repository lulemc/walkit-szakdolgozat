import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, useTheme } from "react-native-paper";
import { CustomText } from "@/components/CustomText";
import { Route, routeService } from "@/services/routeService";
import { Ionicons } from "@expo/vector-icons";

interface RouteInfoCardProps {
  route: Route;
  onClose: () => void;
}

const RouteInfoCard: React.FC<RouteInfoCardProps> = ({ route, onClose }) => {
  const theme = useTheme();

  // Format data for display
  const distance = routeService.formatDistance(route.totalDistance);
  const duration = routeService.formatDuration(route.estimatedDuration);
  const pace = routeService.calculatePace(
    route.totalDistance,
    route.estimatedDuration,
  );
  const elevationGain = routeService.formatElevation(route.elevationGain);
  const elevationLoss = routeService.formatElevation(route.elevationLoss);

  // Get score color based on value
  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#10B981"; // Green
    if (score >= 60) return "#F59E0B"; // Orange
    return "#6B7280"; // Gray
  };

  // DEBUG: Log when close is called
  const handleClose = () => {
    console.log("🔴 Close button pressed!");
    console.log("🔴 onClose prop:", typeof onClose);
    onClose();
    console.log("✅ onClose() called");
  };

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        {/* Header with Close Button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CustomText variant="titleMedium" style={styles.title}>
              📊 Route Summary
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

          {/* Close Button */}
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons name="close-circle" size={28} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <CustomText style={styles.statIcon}>📏</CustomText>
            <CustomText variant="bodySmall" style={styles.statLabel}>
              Distance
            </CustomText>
            <CustomText variant="titleMedium" style={styles.statValue}>
              {distance}
            </CustomText>
          </View>

          <View style={styles.statItem}>
            <CustomText style={styles.statIcon}>⏱️</CustomText>
            <CustomText variant="bodySmall" style={styles.statLabel}>
              Duration
            </CustomText>
            <CustomText variant="titleMedium" style={styles.statValue}>
              {duration}
            </CustomText>
          </View>

          <View style={styles.statItem}>
            <CustomText style={styles.statIcon}>⚡</CustomText>
            <CustomText variant="bodySmall" style={styles.statLabel}>
              Pace
            </CustomText>
            <CustomText variant="titleMedium" style={styles.statValue}>
              {pace}
            </CustomText>
          </View>
        </View>

        {/* Elevation (if available) */}
        {(route.elevationGain > 0 || route.elevationLoss > 0) && (
          <View style={styles.elevationSection}>
            <View style={styles.divider} />
            <CustomText variant="bodyMedium" style={styles.elevationTitle}>
              ⛰️ Elevation
            </CustomText>
            <View style={styles.elevationGrid}>
              <View style={styles.elevationItem}>
                <CustomText style={styles.elevationIcon}>↗️</CustomText>
                <CustomText variant="bodySmall" style={styles.elevationLabel}>
                  Gain
                </CustomText>
                <CustomText variant="titleSmall" style={styles.elevationValue}>
                  {elevationGain}
                </CustomText>
              </View>
              <View style={styles.elevationItem}>
                <CustomText style={styles.elevationIcon}>↘️</CustomText>
                <CustomText variant="bodySmall" style={styles.elevationLabel}>
                  Loss
                </CustomText>
                <CustomText variant="titleSmall" style={styles.elevationValue}>
                  {elevationLoss}
                </CustomText>
              </View>
            </View>
          </View>
        )}

        {/* Preferences Active */}
        {Object.values(route.preferences).some((v) => v) && (
          <>
            <View style={styles.divider} />
            <View style={styles.preferencesSection}>
              <CustomText variant="bodySmall" style={styles.preferencesLabel}>
                Active Preferences:
              </CustomText>
              <View style={styles.preferenceChips}>
                {route.preferences.parks && (
                  <View style={styles.chip}>
                    <CustomText style={styles.chipText}>🌳 Parks</CustomText>
                  </View>
                )}
                {route.preferences.waterfront && (
                  <View style={styles.chip}>
                    <CustomText style={styles.chipText}>
                      💧 Waterfront
                    </CustomText>
                  </View>
                )}
                {route.preferences.scenic && (
                  <View style={styles.chip}>
                    <CustomText style={styles.chipText}>🏛️ Scenic</CustomText>
                  </View>
                )}
                {route.preferences.uphill && (
                  <View style={styles.chip}>
                    <CustomText style={styles.chipText}>⛰️ Uphill</CustomText>
                  </View>
                )}
                {route.preferences.mountain && (
                  <View style={styles.chip}>
                    <CustomText style={styles.chipText}>🏔️ Mountain</CustomText>
                  </View>
                )}
                {route.preferences.quietStreets && (
                  <View style={styles.chip}>
                    <CustomText style={styles.chipText}>🤫 Quiet</CustomText>
                  </View>
                )}
                {route.preferences.beach && (
                  <View style={styles.chip}>
                    <CustomText style={styles.chipText}>🏖️ Beach</CustomText>
                  </View>
                )}
                {route.preferences.avoidHighways && (
                  <View style={styles.chip}>
                    <CustomText style={styles.chipText}>
                      🚫 No Highways
                    </CustomText>
                  </View>
                )}
              </View>
            </View>
          </>
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
    padding: 8,
    backgroundColor: "#FEE2E2", // Light red background
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
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
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
    color: "#6B7280",
    marginBottom: 2,
  },
  elevationValue: {
    fontWeight: "600",
  },
  preferencesSection: {
    marginTop: 4,
  },
  preferencesLabel: {
    color: "#6B7280",
    marginBottom: 8,
  },
  preferenceChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    color: "#374151",
  },
});

export default RouteInfoCard;
