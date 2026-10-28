import api from './api';
import type { ApiResponse } from '@/types/api';
import type {
  RecordWalkRequest,
  Walk,
  WalkActivity,
  WalkPage,
  WalkStats,
  WalkStatsRange,
  WalkSummary,
} from '@/types/walk';

const unwrap = <T>(response: { data: ApiResponse<T> }) => response.data.data;

type WalkSavedListener = (walk: Walk) => void;
const walkSavedListeners = new Set<WalkSavedListener>();

export const walkService = {
  /** Saves a finished walk, then tells the screens that show walks */
  async record(request: RecordWalkRequest): Promise<Walk> {
    const walk = unwrap(await api.post<ApiResponse<Walk>>('/walks', request));
    walkSavedListeners.forEach((listener) => listener(walk));
    return walk;
  },

  /**
   * Called after every saved walk, e.g. to reload the history, which stays
   * mounted in its tab. Returns a function that unsubscribes.
   */
  onWalkSaved(listener: WalkSavedListener): () => void {
    walkSavedListeners.add(listener);
    return () => walkSavedListeners.delete(listener);
  },

  /** Newest first; pass the oldest loaded walk's startedAt as `before` for more */
  async list(page: WalkPage = {}): Promise<WalkSummary[]> {
    return unwrap(await api.get<ApiResponse<WalkSummary[]>>('/walks', { params: page }));
  },

  async get(walkId: string): Promise<Walk> {
    return unwrap(await api.get<ApiResponse<Walk>>(`/walks/${walkId}`));
  },

  /** When and how far I walked since `from` (ISO time), oldest first */
  async activity(from: string): Promise<WalkActivity[]> {
    return unwrap(await api.get<ApiResponse<WalkActivity[]>>('/walks/activity', { params: { from } }));
  },

  async stats(range: WalkStatsRange = {}): Promise<WalkStats> {
    return unwrap(await api.get<ApiResponse<WalkStats>>('/walks/stats', { params: range }));
  },
};
