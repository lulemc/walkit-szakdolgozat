import {
  compareDays,
  currentStreak,
  hasAnyActivity,
  percentChange,
  summarize,
} from "../healthStats";
import type { HealthData } from "@/services/healthKitService";

const day = (steps: number, distance = steps * 0.75, calories = steps * 0.04): HealthData => ({
  steps,
  distance,
  calories,
  date: new Date(2026, 9, 1),
});

describe("summarize", () => {
  it("returns null when there are no days", () => {
    expect(summarize([])).toBeNull();
  });

  it("calculates totals, averages, active days and the best day", () => {
    const days = [day(4000, 3000, 160), day(8000, 6000, 320), day(6000, 4500, 240)];

    const summary = summarize(days)!;

    expect(summary.totalSteps).toBe(18000);
    expect(summary.totalDistance).toBe(13500);
    expect(summary.totalCalories).toBe(720);
    expect(summary.averageSteps).toBe(6000);
    expect(summary.averageDistance).toBe(4500);
    expect(summary.averageCalories).toBe(240);
    expect(summary.activeDays).toBe(2);
    expect(summary.dayCount).toBe(3);
    expect(summary.bestDay).toBe(days[1]);
  });
});

describe("percentChange", () => {
  it("returns a rounded percentage increase", () => {
    expect(percentChange(150, 100)).toBe(50);
  });

  it("returns a negative percentage for a decrease", () => {
    expect(percentChange(75, 100)).toBe(-25);
  });

  it("returns null when there is no baseline", () => {
    expect(percentChange(500, 0)).toBeNull();
  });
});

describe("compareDays", () => {
  it("returns null trends when a day is missing", () => {
    expect(compareDays(day(1000), null)).toEqual({ steps: null, distance: null, calories: null });
  });

  it("compares each metric against yesterday", () => {
    expect(compareDays(day(12000, 9000, 500), day(8000, 6000, 0))).toEqual({
      steps: 50,
      distance: 50,
      calories: null,
    });
  });
});

describe("currentStreak", () => {
  it("counts consecutive active days ending today", () => {
    expect(currentStreak([day(6000), day(7000), day(5000)])).toBe(3);
  });

  it("stops at the first inactive day", () => {
    expect(currentStreak([day(6000), day(1000), day(6000), day(6000)])).toBe(2);
  });

  it("does not let an unfinished today break the streak", () => {
    expect(currentStreak([day(6000), day(6000), day(200)])).toBe(2);
  });

  it("returns 0 when yesterday was inactive too", () => {
    expect(currentStreak([day(6000), day(200), day(200)])).toBe(0);
  });

  it("returns 0 for no days", () => {
    expect(currentStreak([])).toBe(0);
  });
});

describe("hasAnyActivity", () => {
  it("is false when every metric is zero", () => {
    expect(hasAnyActivity([day(0, 0, 0), day(0, 0, 0)])).toBe(false);
  });

  it("is true when any metric is recorded", () => {
    expect(hasAnyActivity([day(0, 0, 0), day(0, 0, 12)])).toBe(true);
  });
});
