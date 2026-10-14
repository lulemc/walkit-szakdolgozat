import { normalizeDaily, normalizeHourly, parseHealthDate, startOfDay } from "../normalize";

const NOW = new Date(2026, 9, 13, 15, 30);

describe("parseHealthDate", () => {
  it("parses compact offsets like +0200", () => {
    const date = new Date(2026, 9, 13, 8);
    const offset = -date.getTimezoneOffset();
    const pad = (n: number) => `${Math.abs(n)}`.padStart(2, "0");
    const sign = offset >= 0 ? "+" : "-";
    const text = `2026-10-13T08:00:00.000${sign}${pad(Math.trunc(offset / 60))}${pad(offset % 60)}`;

    expect(parseHealthDate(text).getTime()).toBe(date.getTime());
  });

  it("parses UTC instants", () => {
    const date = new Date(2026, 9, 13, 8);
    expect(parseHealthDate(date.toISOString()).getTime()).toBe(date.getTime());
  });

  it("treats date-times without an offset as local time", () => {
    expect(parseHealthDate("2026-10-13T00:00")).toEqual(new Date(2026, 9, 13));
  });
});

describe("startOfDay", () => {
  it("returns local midnight without changing the input", () => {
    const input = new Date(NOW);
    expect(startOfDay(input)).toEqual(new Date(2026, 9, 13));
    expect(input).toEqual(NOW);
  });
});

describe("normalizeHourly", () => {
  it("returns 24 zero-filled hours", () => {
    const hourly = normalizeHourly([], NOW);
    expect(hourly).toHaveLength(24);
    expect(hourly.every((h, i) => h.hour === i && h.steps === 0)).toBe(true);
  });

  it("sums buckets into their local hour, rounding and clamping", () => {
    const hourly = normalizeHourly(
      [
        { start: new Date(2026, 9, 13, 8), steps: 1200.4 },
        { start: new Date(2026, 9, 13, 8, 30), steps: 99.6 },
        { start: new Date(2026, 9, 13, 9), steps: -5 },
        { start: new Date(2026, 9, 13, 10), steps: Number.NaN },
      ],
      NOW,
    );

    expect(hourly[8].steps).toBe(1300);
    expect(hourly[9].steps).toBe(0);
    expect(hourly[10].steps).toBe(0);
  });

  it("ignores buckets from other days", () => {
    const hourly = normalizeHourly([{ start: new Date(2026, 9, 12, 23), steps: 400 }], NOW);
    expect(hourly[23].steps).toBe(0);
  });
});

describe("normalizeDaily", () => {
  it("returns `days` zero-filled days, oldest first, ending today", () => {
    const days = normalizeDaily([], 3, NOW);
    expect(days.map((d) => d.date)).toEqual([
      new Date(2026, 9, 11),
      new Date(2026, 9, 12),
      new Date(2026, 9, 13),
    ]);
    expect(days.every((d) => d.steps === 0 && d.distance === 0 && d.calories === 0)).toBe(true);
  });

  it("merges per-metric buckets into the same day", () => {
    const days = normalizeDaily(
      [
        { start: new Date(2026, 9, 13), steps: 8000 },
        { start: new Date(2026, 9, 13), distance: 6100.4 },
        { start: new Date(2026, 9, 13, 6), calories: 320.2 },
        { start: new Date(2026, 9, 11), steps: 5000 },
      ],
      3,
      NOW,
    );

    expect(days[0]).toMatchObject({ steps: 5000, distance: 0, calories: 0 });
    expect(days[1]).toMatchObject({ steps: 0, distance: 0, calories: 0 });
    expect(days[2]).toMatchObject({ steps: 8000, distance: 6100, calories: 320 });
  });

  it("ignores buckets outside the range", () => {
    const days = normalizeDaily([{ start: new Date(2026, 9, 10), steps: 999 }], 3, NOW);
    expect(days.reduce((sum, d) => sum + d.steps, 0)).toBe(0);
  });
});
