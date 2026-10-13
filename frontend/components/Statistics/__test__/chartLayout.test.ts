import {
  barCenter,
  CHART_SECTIONS,
  fitBars,
  fitLine,
  niceMax,
  pointX,
} from "../chartLayout";

// Card content widths: iPhone SE, iPhone 15, iPad
const WIDTHS = [256, 326, 960];

describe("fitBars", () => {
  it.each(WIDTHS)("fits 24 and 7 bars into a %ipx container", (width) => {
    for (const count of [24, 7]) {
      const layout = fitBars(width, count);
      const used =
        layout.initialSpacing * 2 + count * layout.barWidth + (count - 1) * layout.spacing;

      expect(used).toBeLessThanOrEqual(layout.chartWidth + 0.001);
      expect(layout.barWidth).toBeGreaterThan(2);
      expect(layout.spacing).toBeGreaterThan(0);
    }
  });

  it("places bar centres inside the chart", () => {
    const layout = fitBars(326, 24);
    expect(barCenter(layout, 0)).toBeGreaterThan(0);
    expect(barCenter(layout, 23)).toBeLessThan(layout.chartWidth);
  });
});

describe("fitLine", () => {
  it.each(WIDTHS)("spreads 30 points across a %ipx container", (width) => {
    const layout = fitLine(width, 30);

    expect(pointX(layout, 0)).toBe(layout.initialSpacing);
    expect(pointX(layout, 29) + layout.initialSpacing).toBeCloseTo(layout.chartWidth);
  });
});

describe("niceMax", () => {
  it("rounds up to a value that splits into readable sections", () => {
    expect(niceMax([12000])).toBe(12000);
    expect(niceMax([13284])).toBe(16000);
    expect(niceMax([1800])).toBe(2000);
  });

  it("respects the minimum so the goal line stays visible", () => {
    expect(niceMax([800], 11000)).toBe(12000);
  });

  it("never returns 0 for empty or all-zero data", () => {
    expect(niceMax([])).toBeGreaterThan(0);
    expect(niceMax([0, 0])).toBeGreaterThan(0);
  });

  it("is always at least the largest value and divisible into sections", () => {
    for (const value of [37, 640, 2999, 8123, 15555, 48000]) {
      const max = niceMax([value]);
      expect(max).toBeGreaterThanOrEqual(value);
      expect(Number.isInteger(max / CHART_SECTIONS)).toBe(true);
    }
  });
});
