import React, { useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useHealthData } from "@/hooks/useHealthData";
import { StatisticsHeader } from "@/components/Statistics/StatisticsHeader";
import { LoadingState } from "@/components/Statistics/LoadingState";
import { ErrorState } from "@/components/Statistics/ErrorState";
import { EmptyState } from "@/components/Statistics/EmptyState";

export default function StatisticsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");

  const {
    todayStats,
    weekStats,
    monthStats,
    loading,
    error,
    refetch,
    hasPermission,
  } = useHealthData();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Loading state
  if (loading && !todayStats) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // Empty state (no data)
  if (
    !todayStats ||
    (todayStats.steps === 0 &&
      todayStats.distance === 0 &&
      todayStats.calories === 0)
  ) {
    return <EmptyState />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        <StatisticsHeader lastUpdated={new Date()} onRefresh={onRefresh} />

        {/* Today's Highlights - Will add in Phase 2 */}
        <View style={styles.placeholder}>
          <View style={styles.placeholderText}>
            <Text style={styles.placeholderTitle}>Today's Stats:</Text>
            <Text style={styles.placeholderItem}>
              👟 Steps: {todayStats.steps.toLocaleString()}
            </Text>
            <Text style={styles.placeholderItem}>
              🚶 Distance: {(todayStats.distance / 1000).toFixed(1)}km
            </Text>
            <Text style={styles.placeholderItem}>
              🔥 Calories: {Math.round(todayStats.calories)} kcal
            </Text>
          </View>
        </View>

        {/* Tab Navigation - Will add in Phase 3 */}
        {/* View Content - Will add in Phases 4-5 */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  placeholder: {
    margin: 16,
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  placeholderText: {
    gap: 12,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  placeholderItem: {
    fontSize: 16,
    color: "#4B5563",
  },
});
