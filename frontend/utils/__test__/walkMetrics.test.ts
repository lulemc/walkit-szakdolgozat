import {
  formatElapsed,
  formatPace,
  formatWalkDistance,
  haversineMeters,
  segmentsDistance,
} from '../walkMetrics';

const a = { latitude: 47.5, longitude: 19.04 };
// About 111 m north of a (0.001° of latitude)
const b = { latitude: 47.501, longitude: 19.04 };
const c = { latitude: 47.502, longitude: 19.04 };

describe('haversineMeters', () => {
  it('measures the distance between two points', () => {
    expect(haversineMeters(a, b)).toBeCloseTo(111.2, 0);
    expect(haversineMeters(a, a)).toBe(0);
  });
});

describe('segmentsDistance', () => {
  it('adds up each segment of the path', () => {
    expect(segmentsDistance([[a, b, c]])).toBeCloseTo(222.4, 0);
  });

  it("doesn't count the jump between segments (e.g. moving while paused)", () => {
    expect(segmentsDistance([[a, b], [c]])).toBeCloseTo(111.2, 0);
    expect(segmentsDistance([[a], [b, c]])).toBeCloseTo(111.2, 0);
  });

  it('is 0 without points', () => {
    expect(segmentsDistance([])).toBe(0);
    expect(segmentsDistance([[]])).toBe(0);
  });
});

describe('formatElapsed', () => {
  it('shows minutes and seconds, and hours when needed', () => {
    expect(formatElapsed(0)).toBe('0m 0s');
    expect(formatElapsed(125)).toBe('2m 5s');
    expect(formatElapsed(3725)).toBe('1h 2m 5s');
  });
});

describe('formatWalkDistance', () => {
  it('shows metres below a kilometre, kilometres with two decimals above', () => {
    expect(formatWalkDistance(850.4)).toBe('850m');
    expect(formatWalkDistance(1234)).toBe('1.23km');
  });
});

describe('formatPace', () => {
  it('shows minutes per kilometre', () => {
    // 10 minutes for 1 km
    expect(formatPace(600, 1000)).toBe('10:00');
    // 9.5 minutes per km
    expect(formatPace(570, 1000)).toBe('9:30');
  });

  it('shows 0:00 before any distance', () => {
    expect(formatPace(30, 0)).toBe('0:00');
  });
});
