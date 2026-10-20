import { makeWalkDetail } from '@/components/Social/__test__/groupWalkFixtures';
import { canStartWalk, groupWalkToRoute } from '../groupWalkRoute';

describe('groupWalkToRoute', () => {
  it("turns the walk's copy of the route into a route the walk screen can follow", () => {
    const walk = makeWalkDetail();

    const route = groupWalkToRoute(walk);

    expect(route).toEqual(
      expect.objectContaining({
        _id: 'w1',
        userId: 'u1',
        name: 'Riverside loop',
        type: 'circular',
        coordinates: walk.route.coordinates,
        totalDistance: walk.route.totalDistance,
        estimatedDuration: walk.route.estimatedDuration,
        startLocation: walk.route.startLocation,
        endLocation: walk.route.endLocation,
        preferences: walk.route.preferences,
        isFavorite: false,
      }),
    );
  });

  it('works when the organiser deleted their account', () => {
    const route = groupWalkToRoute(makeWalkDetail({ organiser: { _id: null, name: 'Deleted user' } }));

    expect(route.userId).toBe('');
  });
});

// Jest runs in America/Sao_Paulo; the walk is at 10:30 local time on Jan 2, 2030
describe('canStartWalk', () => {
  const going = makeWalkDetail({ myStatus: 'accepted' });

  it('lets people who are going start on the day of the walk', () => {
    expect(canStartWalk(going, new Date(2030, 0, 2, 0, 1))).toBe(true);
    // also after the start time, for latecomers
    expect(canStartWalk(going, new Date(2030, 0, 2, 23, 59))).toBe(true);
  });

  it('uses the local day, not the UTC day', () => {
    // 22:30 local on Jan 2 is already Jan 3 in UTC
    expect(canStartWalk(going, new Date(2030, 0, 2, 22, 30))).toBe(true);
  });

  it('not on another day', () => {
    expect(canStartWalk(going, new Date(2030, 0, 1, 23, 59))).toBe(false);
    expect(canStartWalk(going, new Date(2030, 0, 3, 0, 0))).toBe(false);
  });

  it("not for people who haven't accepted", () => {
    const day = new Date(2030, 0, 2, 9, 0);
    expect(canStartWalk(makeWalkDetail({ myStatus: 'invited' }), day)).toBe(false);
    expect(canStartWalk(makeWalkDetail({ myStatus: 'declined' }), day)).toBe(false);
  });

  it('not when the walk was cancelled', () => {
    expect(canStartWalk(makeWalkDetail({ myStatus: 'accepted', status: 'cancelled' }), new Date(2030, 0, 2, 9, 0))).toBe(
      false,
    );
  });
});
