import { elevationProfile } from '../elevationProfile';

// About 111 m per 0.001° of latitude
const point = (northM: number, elevation?: number) => ({
  latitude: 47.5 + northM / 111_195,
  longitude: 19.04,
  ...(elevation !== undefined && { elevation }),
});

describe('elevationProfile', () => {
  it('needs at least two points with a height', () => {
    expect(elevationProfile([])).toBeNull();
    expect(elevationProfile([point(0, 100), point(500)])).toBeNull();
  });

  it('needs the path to go somewhere', () => {
    expect(elevationProfile([point(0, 100), point(0, 120)])).toBeNull();
  });

  it('gives the lowest and highest point and one bar per sample', () => {
    const profile = elevationProfile([point(0, 110), point(500, 135), point(1000, 120)], 10);

    expect(profile).toMatchObject({ minM: 110, maxM: 135 });
    expect(profile?.bars).toHaveLength(10);
  });

  it('rises with a climb, from the lowest bar to the highest', () => {
    const bars = elevationProfile([point(0, 100), point(1000, 200)], 5)!.bars;

    expect([...bars].sort((a, b) => a - b)).toEqual(bars);
    expect(bars[0]).toBeLessThan(0.3);
    expect(bars[4]).toBeGreaterThan(0.9);
  });

  // A short steep start and a long flat top: most of the walk is high up
  it('samples by distance walked, not by point', () => {
    const bars = elevationProfile([point(0, 100), point(100, 200), point(1100, 200)], 20)!.bars;

    expect(bars.filter((bar) => bar === 1).length).toBeGreaterThanOrEqual(17);
  });

  it('draws a flat route as an even line', () => {
    const bars = elevationProfile([point(0, 150), point(1000, 150)], 4)!.bars;

    expect(new Set(bars).size).toBe(1);
  });
});
