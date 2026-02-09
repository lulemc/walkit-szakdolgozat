import { formatDuration, calculateWalkDuration, formatDistance } from '../timeUtils';

describe('timeUtils', () => {
  describe('formatDuration', () => {
    it('formats minutes under 60', () => {
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(45)).toBe('45 min');
      expect(formatDuration(1)).toBe('1 min');
      expect(formatDuration(59)).toBe('59 min');
    });

    it('formats exactly 60 minutes as 1 hour', () => {
      expect(formatDuration(60)).toBe('1 h');
    });

    it('formats hours and minutes', () => {
      expect(formatDuration(90)).toBe('1 h 30 min');
      expect(formatDuration(75)).toBe('1 h 15 min');
      expect(formatDuration(125)).toBe('2 h 5 min');
    });

    it('formats multiple hours without minutes', () => {
      expect(formatDuration(120)).toBe('2 h');
      expect(formatDuration(180)).toBe('3 h');
    });

    it('rounds minutes properly', () => {
      expect(formatDuration(30.4)).toBe('30 min');
      expect(formatDuration(30.6)).toBe('31 min');
      expect(formatDuration(90.4)).toBe('1 h 30 min');
      expect(formatDuration(90.6)).toBe('1 h 31 min');
    });

    it('handles large durations', () => {
      expect(formatDuration(240)).toBe('4 h');
      expect(formatDuration(245)).toBe('4 h 5 min');
    });
  });

  describe('calculateWalkDuration', () => {
    it('calculates duration with default pace (11 min/km)', () => {
      expect(calculateWalkDuration(5)).toBe(55); // 5 * 11 = 55
      expect(calculateWalkDuration(10)).toBe(110); // 10 * 11 = 110
      expect(calculateWalkDuration(2.5)).toBe(27.5); // 2.5 * 11 = 27.5
    });

    it('calculates duration with custom pace', () => {
      expect(calculateWalkDuration(5, 10)).toBe(50); // 5 * 10 = 50
      expect(calculateWalkDuration(5, 15)).toBe(75); // 5 * 15 = 75
      expect(calculateWalkDuration(5, 12)).toBe(60); // 5 * 12 = 60
    });

    it('handles small distances', () => {
      expect(calculateWalkDuration(0.5)).toBe(5.5); // 0.5 * 11 = 5.5
      expect(calculateWalkDuration(1)).toBe(11); // 1 * 11 = 11
    });

    it('handles large distances', () => {
      expect(calculateWalkDuration(20)).toBe(220); // 20 * 11 = 220
      expect(calculateWalkDuration(50)).toBe(550); // 50 * 11 = 550
    });
  });

  describe('formatDistance', () => {
    it('formats distances less than 1 km in meters', () => {
      expect(formatDistance(0.5)).toBe('500 m');
      expect(formatDistance(0.25)).toBe('250 m');
      expect(formatDistance(0.8)).toBe('800 m');
    });

    it('formats distances 1-10 km with one decimal', () => {
      expect(formatDistance(1)).toBe('1.0 km');
      expect(formatDistance(2.5)).toBe('2.5 km');
      expect(formatDistance(5.7)).toBe('5.7 km');
      expect(formatDistance(9.9)).toBe('9.9 km');
    });

    it('formats distances 10 km and above as whole numbers', () => {
      expect(formatDistance(10)).toBe('10 km');
      expect(formatDistance(15.7)).toBe('16 km');
      expect(formatDistance(20.3)).toBe('20 km');
      expect(formatDistance(50)).toBe('50 km');
    });

    it('rounds properly', () => {
      expect(formatDistance(0.456)).toBe('456 m');
      expect(formatDistance(10.4)).toBe('10 km');
      expect(formatDistance(10.6)).toBe('11 km');
    });
  });
});