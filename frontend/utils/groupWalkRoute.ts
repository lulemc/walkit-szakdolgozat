import type { Route } from '@/services/routeService';
import type { GroupWalkDetail } from '@/types/social';

/**
 * The walk's copy of the route as a Route, so the existing walk screen can
 * follow it. Fields a copy doesn't have get neutral values.
 */
export const groupWalkToRoute = (walk: GroupWalkDetail): Route => ({
  ...walk.route,
  // The copy has no id of its own; the walk's id identifies it
  _id: walk._id,
  userId: walk.organiser._id ?? '',
  preferenceScore: 0,
  isFavorite: false,
  favoritedAt: null,
  lastWalkedAt: null,
  walkCount: 0,
  createdAt: walk.createdAt,
  updatedAt: walk.updatedAt,
});

const isSameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** People going to a walk (the organiser too) can start it on its day, in their own time zone */
export const canStartWalk = (walk: GroupWalkDetail, now: Date = new Date()): boolean =>
  walk.status === 'scheduled' &&
  walk.myStatus === 'accepted' &&
  isSameLocalDay(new Date(walk.scheduledAt), now);
