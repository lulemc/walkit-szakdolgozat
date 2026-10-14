/** Width reserved for y-axis labels; pass it to the charts as yAxisLabelWidth */
export const Y_AXIS_WIDTH = 36;
export const CHART_SECTIONS = 4;

// gifted-charts draws a little past the last bar/point
const CHART_END_PADDING = 8;

// Section sizes that give round axis labels (1k, 2.5k, 4k ...)
const NICE_STEPS = [
  25, 50, 100, 250, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000, 20000,
  25000, 50000,
];

export interface BarLayout {
  chartWidth: number;
  barWidth: number;
  spacing: number;
  initialSpacing: number;
}

export interface LineLayout {
  chartWidth: number;
  spacing: number;
  initialSpacing: number;
}

const plotWidth = (containerWidth: number) =>
  Math.max(containerWidth - Y_AXIS_WIDTH - CHART_END_PADDING, 0);

/** Fits `count` bars into the container: bars take `barRatio` of each slot, gaps the rest */
export const fitBars = (containerWidth: number, count: number, barRatio = 0.6): BarLayout => {
  const chartWidth = plotWidth(containerWidth);
  const slot = count > 0 ? chartWidth / count : 0;
  const barWidth = Math.max(slot * barRatio, 2);
  const spacing = Math.max(slot - barWidth, 1);

  // Half a gap at each end, so initial + bars + gaps + end equals chartWidth
  return { chartWidth, barWidth, spacing, initialSpacing: spacing / 2 };
};

/** Spreads `count` points across the container with an inset at both ends */
export const fitLine = (containerWidth: number, count: number, inset = 8): LineLayout => {
  const chartWidth = plotWidth(containerWidth);
  const spacing = count > 1 ? (chartWidth - inset * 2) / (count - 1) : 0;

  return { chartWidth, spacing: Math.max(spacing, 0), initialSpacing: inset };
};

export const barCenter = (layout: BarLayout, index: number) =>
  layout.initialSpacing + index * (layout.barWidth + layout.spacing) + layout.barWidth / 2;

export const pointX = (layout: LineLayout, index: number) =>
  layout.initialSpacing + index * layout.spacing;

/** Rounds the chart's top value up so it splits into CHART_SECTIONS round labels */
export const niceMax = (values: number[], minimum = 0): number => {
  const max = Math.max(minimum, 1, ...values);
  const rawStep = max / CHART_SECTIONS;
  const step =
    NICE_STEPS.find((candidate) => candidate >= rawStep) ?? Math.ceil(rawStep / 50000) * 50000;

  return step * CHART_SECTIONS;
};
