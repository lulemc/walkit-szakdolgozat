/* eslint-disable import/first */
jest.mock("@/hooks/useHealthData");
jest.mock("react-native-gifted-charts", () => ({
  BarChart: () => null,
  LineChart: () => null,
}));

import React from "react";
import { RefreshControl } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { useHealthData, UseHealthDataReturn } from "@/hooks/useHealthData";
import { renderWithTheme } from "@/components/Statistics/__test__/renderWithTheme";
import { summarize } from "@/utils/healthStats";
import StatisticsScreen from "../StatisticsScreen";

const mockedUseHealthData = useHealthData as jest.MockedFunction<typeof useHealthData>;

const makeDays = (steps: (i: number) => number) =>
  Array.from({ length: 30 }, (_, i) => ({
    steps: steps(i),
    distance: steps(i) * 0.75,
    calories: steps(i) * 0.04,
    date: new Date(2026, 8, 14 + i),
  }));

const healthState = (overrides: Partial<UseHealthDataReturn> = {}): UseHealthDataReturn => {
  const month = makeDays((i) => (i === 29 ? 12847 : i === 28 ? 8234 : 7000));
  const week = month.slice(-7);
  return {
    status: "ready",
    error: null,
    today: month[29],
    yesterday: month[28],
    hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, steps: hour === 9 ? 1500 : 0 })),
    week,
    month,
    weekSummary: summarize(week),
    monthSummary: summarize(month),
    trends: { steps: 56, distance: 56, calories: 56 },
    streak: 30,
    refreshing: false,
    lastUpdated: new Date(),
    refresh: jest.fn().mockResolvedValue(undefined),
    providerName: "Apple Health",
    openSettings: jest.fn().mockResolvedValue(undefined),
    openInstallPage: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

describe("StatisticsScreen", () => {
  it("shows the skeleton while loading", () => {
    mockedUseHealthData.mockReturnValue(healthState({ status: "loading", today: null }));
    const { getByTestId } = renderWithTheme(<StatisticsScreen />);
    expect(getByTestId("statistics-loading")).toBeTruthy();
  });

  it("shows the unavailable state", () => {
    mockedUseHealthData.mockReturnValue(healthState({ status: "unavailable" }));
    const { getByText } = renderWithTheme(<StatisticsScreen />);
    expect(getByText("Apple Health isn't available")).toBeTruthy();
  });

  it("offers to install Health Connect when it's missing", () => {
    const state = healthState({ status: "notInstalled", providerName: "Health Connect" });
    mockedUseHealthData.mockReturnValue(state);
    const { getByText } = renderWithTheme(<StatisticsScreen />);

    fireEvent.press(getByText("Get Health Connect"));
    expect(state.openInstallPage).toHaveBeenCalled();
  });

  it("retries from the error state", () => {
    const state = healthState({ status: "error", error: new Error("boom") });
    mockedUseHealthData.mockReturnValue(state);
    const { getByText } = renderWithTheme(<StatisticsScreen />);

    fireEvent.press(getByText("Try again"));
    expect(state.refresh).toHaveBeenCalled();
  });

  it("shows the empty state when 30 days have no activity", () => {
    const month = makeDays(() => 0).map((d) => ({ ...d, distance: 0, calories: 0 }));
    mockedUseHealthData.mockReturnValue(
      healthState({ month, week: month.slice(-7), today: month[29] }),
    );
    const { getByText } = renderWithTheme(<StatisticsScreen />);
    expect(getByText("No activity yet")).toBeTruthy();
  });

  it("highlights today's stats with goal progress and trends", () => {
    mockedUseHealthData.mockReturnValue(healthState());
    const { getByText, getAllByText } = renderWithTheme(<StatisticsScreen />);

    expect(getByText("12,847")).toBeTruthy();
    expect(getByText("Daily goal reached 🎉")).toBeTruthy();
    expect(getAllByText("+56% vs yesterday")).toHaveLength(3);
    expect(getByText("9.6km")).toBeTruthy();
    expect(getByText("514 kcal")).toBeTruthy();
  });

  it("switches between Day, Week and Month views", () => {
    mockedUseHealthData.mockReturnValue(healthState());
    const { getByText, queryByText } = renderWithTheme(<StatisticsScreen />);

    expect(getByText("Today by hour")).toBeTruthy();

    fireEvent.press(getByText("Week"));
    expect(getByText("Last 7 days")).toBeTruthy();
    expect(getByText("Daily average")).toBeTruthy();
    expect(queryByText("Today by hour")).toBeNull();

    fireEvent.press(getByText("Month"));
    expect(getByText("Last 30 days")).toBeTruthy();
  });

  it("shows an empty message in the Day view before any steps today", () => {
    mockedUseHealthData.mockReturnValue(
      healthState({ hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, steps: 0 })) }),
    );
    const { getByText } = renderWithTheme(<StatisticsScreen />);
    expect(getByText(/No steps recorded yet today/)).toBeTruthy();
  });

  it("refreshes on pull-to-refresh", () => {
    const state = healthState();
    mockedUseHealthData.mockReturnValue(state);
    const { UNSAFE_getByType } = renderWithTheme(<StatisticsScreen />);

    UNSAFE_getByType(RefreshControl).props.onRefresh();
    expect(state.refresh).toHaveBeenCalled();
  });

  it("keeps showing data with a notice when a refresh failed", () => {
    mockedUseHealthData.mockReturnValue(healthState({ error: new Error("offline") }));
    const { getByText } = renderWithTheme(<StatisticsScreen />);
    expect(getByText("Couldn't refresh. Showing your last data.")).toBeTruthy();
    expect(getByText("12,847")).toBeTruthy();
  });
});
