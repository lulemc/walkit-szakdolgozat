import { formatWalkTime, isWalkOpen } from '../groupWalkTime';

// Jest runs in America/Sao_Paulo (UTC-3)
describe('formatWalkTime', () => {
  it('shows the UTC time from the server in local time', () => {
    expect(formatWalkTime('2030-01-02T13:30:00.000Z')).toBe('Wed, Jan 2, 2030 · 10:30 AM');
  });

  it('shows the local date when it differs from the UTC date', () => {
    expect(formatWalkTime('2030-01-02T01:00:00.000Z')).toBe('Tue, Jan 1, 2030 · 10:00 PM');
  });
});

describe('isWalkOpen', () => {
  const now = new Date('2030-01-01T12:00:00.000Z');

  it('is open while scheduled and still ahead', () => {
    expect(isWalkOpen({ status: 'scheduled', scheduledAt: '2030-01-01T12:00:01.000Z' }, now)).toBe(true);
  });

  it('is closed once the time has come', () => {
    expect(isWalkOpen({ status: 'scheduled', scheduledAt: '2030-01-01T12:00:00.000Z' }, now)).toBe(false);
  });

  it('is closed when cancelled', () => {
    expect(isWalkOpen({ status: 'cancelled', scheduledAt: '2030-02-01T12:00:00.000Z' }, now)).toBe(false);
  });
});
