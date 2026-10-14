import React, { useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { SegmentedButtons, useTheme } from "react-native-paper";
import { CustomText, ScreenContainer } from "@/components";
import { useHealthData } from "@/hooks/useHealthData";
import { StatisticsHeader } from "@/components/Statistics/StatisticsHeader";
import { LoadingState } from "@/components/Statistics/LoadingState";
import { ErrorState } from "@/components/Statistics/ErrorState";
import { EmptyState } from "@/components/Statistics/EmptyState";
import { TodayCard } from "@/components/Statistics/TodayCard";
import { MetricCard } from "@/components/Statistics/MetricCard";
import { ChartCard } from "@/components/Statistics/ChartCard";
import { InsightsRow } from "@/components/Statistics/InsightsRow";
import { DailyChart } from "@/components/Statistics/DailyChart";
import { WeeklyChart } from "@/components/Statistics/WeeklyChart";
import { MonthlyChart } from "@/components/Statistics/MonthlyChart";
import { DAILY_STEP_GOAL, hasAnyActivity, HealthSummary } from "@/utils/healthStats";
import {
  formatCalories,
  formatDate,
  formatDistance,
  formatSteps,
  getDayAbbreviation,
} from "@/utils/healthFormatters";

type StatsView = "day" | "week" | "month";

const VIEW_BUTTONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const summaryLine = (summary: HealthSummary | null) =>
  summary
    ? `${formatSteps(summary.totalSteps)} steps · ${formatDistance(summary.totalDistance)}`
    : undefined;

export default function StatisticsScreen() {
  const theme = useTheme();
  const [view, setView] = useState<StatsView>("day");
  const {
    status,
    error,
    today,
    hourly,
    week,
    month,
    weekSummary,
    monthSummary,
    trends,
    streak,
    refreshing,
    lastUpdated,
    refresh,
    providerName,
    openSettings,
    openInstallPage,
  } = useHealthData();

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status !== "ready") {
    return (
      <ErrorState
        variant={status}
        providerName={providerName}
        error={error}
        onRetry={refresh}
        onOpenSettings={openSettings}
        onInstall={openInstallPage}
        retrying={refreshing}
      />
    );
  }

  if (!today || !hasAnyActivity(month)) {
    return <EmptyState providerName={providerName} onRefresh={refresh} refreshing={refreshing} />;
  }

  return (
    <ScreenContainer
      scrollable
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <StatisticsHeader lastUpdated={lastUpdated} providerName={providerName} />

      {error ? (
        <CustomText custom="error" variant="bodySmall" style={styles.notice}>
          {"Couldn't refresh. Showing your last data."}
        </CustomText>
      ) : null}

      <TodayCard steps={today.steps} goal={DAILY_STEP_GOAL} trend={trends.steps} />

      <View style={styles.metrics}>
        <MetricCard
          icon="walk"
          label="Distance"
          value={formatDistance(today.distance)}
          trend={trends.distance}
        />
        <MetricCard
          icon="flame"
          label="Calories"
          value={formatCalories(today.calories)}
          trend={trends.calories}
        />
      </View>

      <SegmentedButtons
        value={view}
        onValueChange={(value) => setView(value as StatsView)}
        buttons={VIEW_BUTTONS}
      />

      {view === "day" && (
        <ChartCard
          title="Today by hour"
          subtitle={`${formatSteps(today.steps)} steps so far`}
          isEmpty={!hourly.some((hour) => hour.steps > 0)}
          emptyMessage="No steps recorded yet today. Your hourly activity will show up here once you start moving."
        >
          {(width) => <DailyChart data={hourly} width={width} />}
        </ChartCard>
      )}

      {view === "week" && (
        <ChartCard
          title="Last 7 days"
          subtitle={summaryLine(weekSummary)}
          isEmpty={!hasAnyActivity(week)}
          emptyMessage="No activity in the last 7 days. Your daily steps will appear here."
          footer={
            weekSummary ? (
              <InsightsRow summary={weekSummary} streak={streak} bestDayLabel={getDayAbbreviation} />
            ) : null
          }
        >
          {(width) => <WeeklyChart data={week} goal={DAILY_STEP_GOAL} width={width} />}
        </ChartCard>
      )}

      {view === "month" && (
        <ChartCard
          title="Last 30 days"
          subtitle={summaryLine(monthSummary)}
          isEmpty={!hasAnyActivity(month)}
          emptyMessage="No activity in the last 30 days. Your daily steps will appear here."
          footer={
            monthSummary ? (
              <InsightsRow summary={monthSummary} streak={streak} bestDayLabel={formatDate} />
            ) : null
          }
        >
          {(width) => <MonthlyChart data={month} goal={DAILY_STEP_GOAL} width={width} />}
        </ChartCard>
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
  notice: {
    textAlign: "center",
  },
  metrics: {
    flexDirection: "row",
    gap: 12,
  },
});
