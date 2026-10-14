import { generateMockHealth } from "../mockHealthData";

const NOW = new Date(2026, 9, 13, 15, 30);

describe("generateMockHealth", () => {
  it("returns 30 days, oldest first, ending today", () => {
    const { month } = generateMockHealth(NOW);

    expect(month).toHaveLength(30);
    expect(month[29].date).toEqual(new Date(2026, 9, 13));
    expect(month[0].date).toEqual(new Date(2026, 8, 14));
    for (let i = 1; i < month.length; i++) {
      expect(month[i].date.getTime()).toBeGreaterThan(month[i - 1].date.getTime());
    }
  });

  it("returns 24 hourly buckets with no steps after the current hour", () => {
    const { hourly } = generateMockHealth(NOW);

    expect(hourly).toHaveLength(24);
    expect(hourly.map((h) => h.hour)).toEqual(Array.from({ length: 24 }, (_, i) => i));
    expect(hourly.slice(16).every((h) => h.steps === 0)).toBe(true);
    expect(hourly.slice(7, 16).some((h) => h.steps > 0)).toBe(true);
  });

  it("makes today's total equal the sum of the hourly buckets", () => {
    const { hourly, month } = generateMockHealth(NOW);
    const hourlyTotal = hourly.reduce((sum, h) => sum + h.steps, 0);

    expect(month[29].steps).toBe(hourlyTotal);
  });

  it("derives distance and calories from steps", () => {
    const { month } = generateMockHealth(NOW);

    for (const day of month) {
      expect(day.distance).toBe(Math.round(day.steps * 0.75));
      expect(day.calories).toBe(Math.round(day.steps * 0.04));
    }
  });

  it("is stable for the same moment", () => {
    expect(generateMockHealth(NOW)).toEqual(generateMockHealth(NOW));
  });
});
