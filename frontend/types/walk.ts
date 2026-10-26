import type { Coordinates } from '@/services/routeService';

/** A walk in the history list (without its path) */
export interface WalkSummary {
  _id: string;
  routeId: string | null;
  groupWalkId: string | null;
  /** The route's or group walk's name when the walk was saved */
  name: string | null;
  startedAt: string;
  endedAt: string;
  /** Time walking, without pauses */
  durationSec: number;
  distanceM: number;
}

export interface Walk extends WalkSummary {
  /** One list of points per stretch between pauses */
  path: Coordinates[][];
}

export interface RecordWalkRequest {
  /** One of my saved routes (not for group walks) */
  routeId?: string;
  groupWalkId?: string;
  /** ISO times */
  startedAt: string;
  endedAt: string;
  durationSec: number;
  distanceM: number;
  path: Coordinates[][];
}

export interface WalkPage {
  /** Only walks started before this ISO time (the oldest one loaded) */
  before?: string;
  limit?: number;
}

export interface WalkStats {
  walkCount: number;
  totalDistanceM: number;
  totalDurationSec: number;
}

export interface WalkStatsRange {
  /** ISO times; walks that started in [from, to) */
  from?: string;
  to?: string;
}
