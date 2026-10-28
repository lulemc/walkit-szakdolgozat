import { pathToPolylines } from '../pathDrawing';

const p = (latitude: number, longitude: number) => ({ latitude, longitude });
const xy = (points: string) => points.split(' ').map((pair) => pair.split(',').map(Number));

describe('pathToPolylines', () => {
  it('needs at least two points', () => {
    expect(pathToPolylines([], 100, 100)).toEqual([]);
    expect(pathToPolylines([[p(47.5, 19.04)]], 100, 100)).toEqual([]);
  });

  it('draws north up and east to the right, inside the padding', () => {
    // Due north-east
    const [line] = pathToPolylines([[p(47.5, 19.04), p(47.501, 19.0415)]], 200, 200, 10);
    const [[x1, y1], [x2, y2]] = xy(line);

    expect(x2).toBeGreaterThan(x1);
    expect(y2).toBeLessThan(y1);
    for (const value of [x1, y1, x2, y2]) {
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(190);
    }
  });

  it('keeps the shape: a walk due north stays a vertical line in the middle', () => {
    const [line] = pathToPolylines([[p(47.5, 19.04), p(47.51, 19.04)]], 300, 100, 0);
    const [[x1, y1], [x2, y2]] = xy(line);

    expect(x1).toBeCloseTo(150);
    expect(x2).toBeCloseTo(150);
    expect(Math.abs(y2 - y1)).toBeCloseTo(100);
  });

  it('keeps pauses as gaps: one line per stretch walked', () => {
    const lines = pathToPolylines(
      [
        [p(47.5, 19.04), p(47.501, 19.04)],
        [p(47.502, 19.04), p(47.503, 19.041)],
      ],
      100,
      100,
    );

    expect(lines).toHaveLength(2);
  });
});
