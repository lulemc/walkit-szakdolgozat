import React from "react";
import { Text } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithTheme } from "./renderWithTheme";
import { TrendChip } from "../TrendChip";
import { TodayCard } from "../TodayCard";
import { InsightsRow } from "../InsightsRow";
import { ChartCard } from "../ChartCard";
import { StatisticsHeader } from "../StatisticsHeader";
import type { HealthSummary } from "@/utils/healthStats";

describe("TrendChip", () => {
  it("shows a positive trend with a plus sign", () => {
    const { getByText } = renderWithTheme(<TrendChip value={12} />);
    expect(getByText("+12% vs yesterday")).toBeTruthy();
  });

  it("shows a negative trend", () => {
    const { getByText } = renderWithTheme(<TrendChip value={-8} />);
    expect(getByText("-8% vs yesterday")).toBeTruthy();
  });

  it("renders nothing without a baseline", () => {
    const { queryByText } = renderWithTheme(<TrendChip value={null} />);
    expect(queryByText(/vs yesterday/)).toBeNull();
  });
});

describe("TodayCard", () => {
  it("shows steps and progress toward the goal", () => {
    const { getByText } = renderWithTheme(<TodayCard steps={4500} goal={10000} trend={null} />);
    expect(getByText("4,500")).toBeTruthy();
    expect(getByText("45% of your daily goal")).toBeTruthy();
  });

  it("celebrates when the goal is reached", () => {
    const { getByText } = renderWithTheme(<TodayCard steps={12847} goal={10000} trend={56} />);
    expect(getByText("Daily goal reached 🎉")).toBeTruthy();
    expect(getByText("+56% vs yesterday")).toBeTruthy();
  });
});

describe("InsightsRow", () => {
  const summary: HealthSummary = {
    totalSteps: 63000,
    totalDistance: 47250,
    totalCalories: 2520,
    averageSteps: 9000,
    averageDistance: 6750,
    averageCalories: 360,
    activeDays: 6,
    dayCount: 7,
    bestDay: { steps: 13284, distance: 9963, calories: 531, date: new Date(2026, 9, 11) },
  };

  it("shows average, best day, active days and streak", () => {
    const { getByText } = renderWithTheme(
      <InsightsRow summary={summary} streak={1} bestDayLabel={() => "Sun"} />,
    );
    expect(getByText("9,000 steps")).toBeTruthy();
    expect(getByText("Sun · 13.3k")).toBeTruthy();
    expect(getByText("6 of 7")).toBeTruthy();
    expect(getByText("1 day")).toBeTruthy();
  });
});

describe("ChartCard", () => {
  it("shows the empty message instead of the chart", () => {
    const { getByText, queryByText } = renderWithTheme(
      <ChartCard title="Today by hour" isEmpty emptyMessage="Nothing yet">
        {() => <Text>chart</Text>}
      </ChartCard>,
    );
    expect(getByText("Nothing yet")).toBeTruthy();
    expect(queryByText("chart")).toBeNull();
  });

  it("renders the chart with the measured width", () => {
    const renderChart = jest.fn(() => <Text>chart</Text>);
    const { getByTestId, getByText } = renderWithTheme(
      <ChartCard title="Last 7 days" isEmpty={false} emptyMessage="Nothing yet">
        {renderChart}
      </ChartCard>,
    );

    fireEvent(getByTestId("chart-area"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 312, height: 200 } },
    });

    expect(getByText("chart")).toBeTruthy();
    expect(renderChart).toHaveBeenLastCalledWith(312);
  });
});

describe("StatisticsHeader", () => {
  it("shows when the data was last updated", () => {
    const { getByText } = renderWithTheme(<StatisticsHeader lastUpdated={new Date()} />);
    expect(getByText("Statistics")).toBeTruthy();
    expect(getByText("Updated just now · pull down to refresh")).toBeTruthy();
  });
});
