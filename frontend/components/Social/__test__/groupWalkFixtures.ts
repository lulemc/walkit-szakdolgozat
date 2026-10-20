import type { GroupWalkDetail, GroupWalkSummary } from '@/types/social';
import { makeRoute } from './routeFixtures';

const { _id, userId, preferenceScore, isFavorite, favoritedAt, lastWalkedAt, walkCount, createdAt, updatedAt, ...route } =
  makeRoute({ name: 'Riverside loop', coordinates: [
    { latitude: 47.5, longitude: 19.04 },
    { latitude: 47.51, longitude: 19.05 },
  ] });

/** A walk as the detail endpoint returns it, seen by the invitee Ann (u2); override what matters */
export const makeWalkDetail = (overrides: Partial<GroupWalkDetail> = {}): GroupWalkDetail => ({
  _id: 'w1',
  title: 'Sunday stroll',
  note: 'Meet at the bridge',
  scheduledAt: '2030-01-02T13:30:00.000Z',
  status: 'scheduled',
  organiser: { _id: 'u1', name: 'Olga' },
  route,
  participants: [
    { user: { _id: 'u1', name: 'Olga' }, role: 'organiser', status: 'accepted' },
    { user: { _id: 'u2', name: 'Ann' }, role: 'invitee', status: 'invited' },
    { user: { _id: 'u3', name: 'Bob' }, role: 'invitee', status: 'declined' },
  ],
  myStatus: 'invited',
  isOrganiser: false,
  counts: { accepted: 1, invited: 1, declined: 1 },
  createdAt: '2026-10-10T10:00:00.000Z',
  updatedAt: '2026-10-10T10:00:00.000Z',
  ...overrides,
});

/** The same walk seen by its organiser Olga (u1) */
export const makeOrganiserWalk = (overrides: Partial<GroupWalkDetail> = {}) =>
  makeWalkDetail({ myStatus: 'accepted', isOrganiser: true, ...overrides });

/** A walk as the list endpoint returns it (no coordinates, note or participants) */
export const makeWalkSummary = (overrides: Partial<GroupWalkSummary> = {}): GroupWalkSummary => {
  const { note, participants, isOrganiser, cancelledAt, createdAt: c, updatedAt: u, route: full, ...rest } =
    makeWalkDetail();
  const { coordinates, ...summaryRoute } = full;
  return { ...rest, route: summaryRoute, ...overrides };
};
