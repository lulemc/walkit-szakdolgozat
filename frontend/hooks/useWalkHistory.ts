import { useCallback, useEffect, useRef, useState } from 'react';
import { walkService } from '@/services/walkService';
import type { WalkSummary } from '@/types/walk';

export const WALK_PAGE_SIZE = 20;

export type WalkHistoryStatus = 'loading' | 'ready' | 'error';

/** My walks, newest first, a page at a time; reloads whenever a walk is saved */
export const useWalkHistory = () => {
  const [walks, setWalks] = useState<WalkSummary[]>([]);
  const [status, setStatus] = useState<WalkHistoryStatus>('loading');
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasData = useRef(false);

  // State is only updated in the promise callbacks, after the request finished
  const load = useCallback(
    () =>
      walkService.list({ limit: WALK_PAGE_SIZE }).then(
        (page) => {
          hasData.current = true;
          setWalks(page);
          // A full page means there may be older walks
          setHasMore(page.length === WALK_PAGE_SIZE);
          setStatus('ready');
        },
        () => {
          // Keep showing the last list if a reload fails
          if (!hasData.current) setStatus('error');
        },
      ),
    [],
  );

  useEffect(() => {
    load();
    return walkService.onWalkSaved(() => {
      load();
    });
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const loadMore = useCallback(async () => {
    const oldest = walks[walks.length - 1];
    if (!oldest) return;
    setLoadingMore(true);
    try {
      const page = await walkService.list({ before: oldest.startedAt, limit: WALK_PAGE_SIZE });
      setWalks((current) => [...current, ...page]);
      setHasMore(page.length === WALK_PAGE_SIZE);
    } catch {
      // The button stays, so loading more can be tried again
    } finally {
      setLoadingMore(false);
    }
  }, [walks]);

  return { walks, status, hasMore, refreshing, loadingMore, refresh, loadMore };
};
