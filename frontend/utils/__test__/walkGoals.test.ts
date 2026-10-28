import { distanceThisWeekM, parseGoalKm, weeklyStreak } from '../walkGoals';

// Wednesday 2 January 2030, local time; that week started on Monday 31 December
const NOW = new Date(2030, 0, 2, 12, 0);
const walkOn = (year: number, month: number, day: number, hour = 9, distanceM = 1000) => ({
  startedAt: new Date(year, month, day, hour).toISOString(),
  distanceM,
});

describe('weeklyStreak', () => {
  it('is 0 without walks', () => {
    expect(weeklyStreak([], NOW)).toBe(0);
  });

  it('counts the weeks in a row with a walk, up to this one', () => {
    const activity = [walkOn(2029, 11, 17), walkOn(2029, 11, 24), walkOn(2029, 11, 26), walkOn(2030, 0, 1)];

    expect(weeklyStreak(activity, NOW)).toBe(3);
  });

  it("doesn't break the streak while this week has no walk yet", () => {
    expect(weeklyStreak([walkOn(2029, 11, 17), walkOn(2029, 11, 24)], NOW)).toBe(2);
  });

  it('ends at a week without a walk', () => {
    expect(weeklyStreak([walkOn(2029, 11, 10), walkOn(2029, 11, 24)], NOW)).toBe(1);
  });

  it('is 0 when the last walk was before last week', () => {
    expect(weeklyStreak([walkOn(2029, 11, 17)], NOW)).toBe(0);
  });

  // Late on Sunday is already Monday in UTC; the phone's week decides
  it('puts a walk late on Sunday night into the week it belongs to locally', () => {
    expect(weeklyStreak([walkOn(2029, 11, 30, 23)], NOW)).toBe(1);
    expect(distanceThisWeekM([walkOn(2029, 11, 30, 23)], NOW)).toBe(0);
  });
});

describe('distanceThisWeekM', () => {
  it('adds up the walks since Monday', () => {
    const activity = [walkOn(2029, 11, 29, 9, 5000), walkOn(2029, 11, 31, 9, 1200), walkOn(2030, 0, 2, 8, 800)];

    expect(distanceThisWeekM(activity, NOW)).toBe(2000);
  });
});

describe('parseGoalKm', () => {
  it.each([
    ['12', 12],
    [' 7.5 ', 7.5],
    ['7,5', 7.5],
    ['1', 1],
    ['200', 200],
  ])('reads "%s" as %s km', (text, km) => {
    expect(parseGoalKm(text)).toBe(km);
  });

  it.each(['', 'abc', '0', '0.5', '201', '-3'])('rejects "%s"', (text) => {
    expect(parseGoalKm(text)).toBeNull();
  });
});
