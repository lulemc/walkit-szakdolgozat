/* eslint-disable import/first */
jest.mock("react-native-gifted-charts", () => ({
  BarChart: jest.fn(() => null),
  LineChart: jest.fn(() => null),
}));

import React from "react";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { renderWithTheme } from "./renderWithTheme";
import { DailyChart } from "../DailyChart";
import { WeeklyChart } from "../WeeklyChart";
import { MonthlyChart } from "../MonthlyChart";
import { Y_AXIS_WIDTH } from "../chartLayout";

// Axis labels are hidden from screen readers, so queries must include hidden elements
const hidden = { includeHiddenElements: true };

const lastProps = (chart: unknown) => {
  const calls = (chart as jest.Mock).mock.calls;
  return calls[calls.length - 1][0];
};

const days = (count: number, steps: (i: number) => number) =>
  Array.from({ length: count }, (_, i) => ({
    steps: steps(i),
    distance: 0,
    calories: 0,
    date: new Date(2026, 8, 14 + i),
  }));

const fitsWidth = (props: any, containerWidth: number) => {
  const count = props.data.length;
  const used =
    props.initialSpacing +
    props.endSpacing +
    count * (props.barWidth ?? 0) +
    (count - 1) * props.spacing;
  return used <= containerWidth - Y_AXIS_WIDTH + 0.001;
};

describe.each([256, 326, 960])("charts at %ipx", (width) => {
  beforeEach(() => jest.clearAllMocks());

  it("DailyChart renders 24 bars that fit, with hour labels", () => {
    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, steps: hour * 100 }));
    const { getByText } = renderWithTheme(<DailyChart data={hourly} width={width} />);

    const props = lastProps(BarChart);
    expect(props.data).toHaveLength(24);
    expect(fitsWidth(props, width)).toBe(true);
    expect(props.disableScroll).toBe(true);
    expect(props.maxValue).toBeGreaterThanOrEqual(2300);
    expect(getByText("0h", hidden)).toBeTruthy();
    expect(getByText("18h", hidden)).toBeTruthy();
  });

  it("WeeklyChart renders 7 bars with a goal line", () => {
    renderWithTheme(<WeeklyChart data={days(7, () => 6000)} goal={10000} width={width} />);

    const props = lastProps(BarChart);
    expect(props.data).toHaveLength(7);
    expect(fitsWidth(props, width)).toBe(true);
    expect(props.showReferenceLine1).toBe(true);
    expect(props.referenceLine1Position).toBe(10000);
    expect(props.maxValue).toBeGreaterThan(10000);
  });

  it("MonthlyChart renders 30 points that fit, with date labels", () => {
    const { getByText } = renderWithTheme(
      <MonthlyChart data={days(30, (i) => 5000 + i * 100)} goal={10000} width={width} />,
    );

    const props = lastProps(LineChart);
    expect(props.data).toHaveLength(30);
    expect(props.initialSpacing + 29 * props.spacing + props.endSpacing).toBeLessThanOrEqual(
      width - Y_AXIS_WIDTH + 0.001,
    );
    expect(getByText("14/9", hidden)).toBeTruthy();
    expect(getByText("13/10", hidden)).toBeTruthy();
  });
});

it("charts handle all-zero data without a zero max value", () => {
  renderWithTheme(<WeeklyChart data={days(7, () => 0)} goal={10000} width={326} />);
  expect(lastProps(BarChart).maxValue).toBeGreaterThan(0);
});
