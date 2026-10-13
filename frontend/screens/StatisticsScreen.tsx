import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useHealthData } from "@/hooks/useHealthData";
import { StatisticsHeader } from "@/components/Statistics/StatisticsHeader";
import { LoadingState } from "@/components/Statistics/LoadingState";
import { ErrorState } from "@/components/Statistics/ErrorState";
import { EmptyState } from "@/components/Statistics/EmptyState";
import { DailyChart } from "@/components/Statistics/DailyChart";
import { WeeklyChart } from "@/components/Statistics/WeeklyChart";
import { MonthlyChart } from "@/components/Statistics/MonthlyChart";
import { CustomText, ScreenContainer } from "@/components";

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

  // Mock hourly data for daily chart
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    steps: i >= 6 && i <= 22 ? Math.floor(Math.random() * 2000) : 0,
  }));

  return (
    <ScreenContainer scrollable={true}>
      <StatisticsHeader lastUpdated={new Date()} onRefresh={onRefresh} />

      {/* Today's Highlights */}
      <View style={styles.placeholder}>
        <View style={styles.placeholderText}>
          <CustomText style={styles.placeholderTitle}>
            Today&#39;s Stats:
          </CustomText>
          <CustomText style={styles.placeholderItem}>
            👟 Steps: {todayStats.steps.toLocaleString()}
          </CustomText>
          <CustomText style={styles.placeholderItem}>
            🚶 Distance: {(todayStats.distance / 1000).toFixed(1)}km
          </CustomText>
          <CustomText style={styles.placeholderItem}>
            🔥 Calories: {Math.round(todayStats.calories)} kcal
          </CustomText>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, view === "daily" && styles.activeTab]}
          onPress={() => setView("daily")}
        >
          <CustomText
            style={[styles.tabText, view === "daily" && styles.activeTabText]}
          >
            Daily
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, view === "weekly" && styles.activeTab]}
          onPress={() => setView("weekly")}
        >
          <CustomText
            style={[styles.tabText, view === "weekly" && styles.activeTabText]}
          >
            Weekly
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, view === "monthly" && styles.activeTab]}
          onPress={() => setView("monthly")}
        >
          <CustomText
            style={[styles.tabText, view === "monthly" && styles.activeTabText]}
          >
            Monthly
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Charts */}
      <View style={styles.chartContainer}>
        {view === "daily" && (
          <View>
            <CustomText style={styles.chartTitle}>Hourly Activity</CustomText>
            <DailyChart data={hourlyData} />
          </View>
        )}

        {view === "weekly" && weekStats.length > 0 && (
          <View>
            <CustomText style={styles.chartTitle}>Weekly Steps</CustomText>
            <WeeklyChart data={weekStats} />

            <View style={styles.summary}>
              <CustomText style={styles.summaryText}>
                Total:{" "}
                {weekStats
                  .reduce((sum, day) => sum + day.steps, 0)
                  .toLocaleString()}{" "}
                steps
              </CustomText>
              <CustomText style={styles.summaryText}>
                Average:{" "}
                {Math.round(
                  weekStats.reduce((sum, day) => sum + day.steps, 0) /
                    weekStats.length,
                ).toLocaleString()}{" "}
                steps/day
              </CustomText>
            </View>
          </View>
        )}

        {view === "monthly" && monthStats.length > 0 && (
          <View>
            <CustomText style={styles.chartTitle}>Monthly Trend</CustomText>
            <MonthlyChart data={monthStats} />

            <View style={styles.summary}>
              <CustomText style={styles.summaryText}>
                Total:{" "}
                {monthStats
                  .reduce((sum, day) => sum + day.steps, 0)
                  .toLocaleString()}{" "}
                steps
              </CustomText>
              <CustomText style={styles.summaryText}>
                Average:{" "}
                {Math.round(
                  monthStats.reduce((sum, day) => sum + day.steps, 0) /
                    monthStats.length,
                ).toLocaleString()}{" "}
                steps/day
              </CustomText>
              <CustomText style={styles.summaryText}>
                Best day:{" "}
                {Math.max(...monthStats.map((d) => d.steps)).toLocaleString()}{" "}
                steps
              </CustomText>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
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
    marginBottom: 8,
  },
  placeholderItem: {
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#007AFF",
  },
  chartContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  summary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
  },
});
