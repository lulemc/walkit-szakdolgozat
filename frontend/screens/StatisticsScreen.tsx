import React, { useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { SegmentedButtons, useTheme } from "react-native-paper";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { CustomText, ScreenContainer } from "@/components";
import { useHealthData } from "@/hooks/useHealthData";
import { useWalkStats } from "@/hooks/useWalkStats";
import { useWalkGoal } from "@/hooks/useWalkGoal";
import { WalkTotalsCard } from "@/components/Walks/WalkTotalsCard";
import { WalkGoalCard } from "@/components/Statistics/WalkGoalCard";
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

const VIEWS = ["day", "week", "month"] as const;

const summaryLine = (summary: HealthSummary | null, t: TFunction<"statistics">) =>
  summary
    ? t("charts.summary", {
        steps: formatSteps(summary.totalSteps),
        distance: formatDistance(summary.totalDistance),
      })
    : undefined;

export default function StatisticsScreen() {
  const theme = useTheme();
  const { t } = useTranslation("statistics");
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
  const { stats: walkStats } = useWalkStats();
  const walkGoal = useWalkGoal();

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
          {t("refreshFailed")}
        </CustomText>
      ) : null}

      <TodayCard steps={today.steps} goal={DAILY_STEP_GOAL} trend={trends.steps} />

      <View style={styles.metrics}>
        <MetricCard
          icon="walk"
          label={t("metrics.distance")}
          value={formatDistance(today.distance)}
          trend={trends.distance}
        />
        <MetricCard
          icon="flame"
          label={t("metrics.calories")}
          value={formatCalories(today.calories)}
          trend={trends.calories}
        />
      </View>

      {walkGoal.loaded ? (
        <WalkGoalCard
          goalKm={walkGoal.goalKm}
          thisWeekM={walkGoal.thisWeekM}
          streak={walkGoal.streak}
          onSaveGoal={walkGoal.saveGoal}
        />
      ) : null}
      {walkStats ? <WalkTotalsCard title={t("walkTotals")} stats={walkStats} /> : null}

      <SegmentedButtons
        value={view}
        onValueChange={(value) => setView(value as StatsView)}
        buttons={VIEWS.map((value) => ({ value, label: t(`views.${value}`) }))}
      />

      {view === "day" && (
        <ChartCard
          title={t("charts.day.title")}
          subtitle={t("charts.day.subtitle", { steps: formatSteps(today.steps) })}
          isEmpty={!hourly.some((hour) => hour.steps > 0)}
          emptyMessage={t("charts.day.empty")}
        >
          {(width) => <DailyChart data={hourly} width={width} />}
        </ChartCard>
      )}

      {view === "week" && (
        <ChartCard
          title={t("charts.week.title")}
          subtitle={summaryLine(weekSummary, t)}
          isEmpty={!hasAnyActivity(week)}
          emptyMessage={t("charts.week.empty")}
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
          title={t("charts.month.title")}
          subtitle={summaryLine(monthSummary, t)}
          isEmpty={!hasAnyActivity(month)}
          emptyMessage={t("charts.month.empty")}
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
