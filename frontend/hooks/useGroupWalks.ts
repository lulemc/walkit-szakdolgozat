import { useCallback, useEffect, useRef, useState } from 'react';
import { groupWalkService } from '@/services/groupWalkService';
import type { GroupWalkSummary } from '@/types/social';

export type GroupWalksStatus = 'loading' | 'ready' | 'error';

/** My walk invitations, upcoming walks and past walks, for the Social hub */
export const useGroupWalks = () => {
  const [invitations, setInvitations] = useState<GroupWalkSummary[]>([]);
  const [upcoming, setUpcoming] = useState<GroupWalkSummary[]>([]);
  const [past, setPast] = useState<GroupWalkSummary[]>([]);
  const [status, setStatus] = useState<GroupWalksStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const hasData = useRef(false);

  // State is only updated in the promise callbacks, after the requests finished
  const load = useCallback(
    () =>
      Promise.all([
        groupWalkService.list('invitations'),
        groupWalkService.list('upcoming'),
        groupWalkService.list('past'),
      ]).then(
        ([loadedInvitations, loadedUpcoming, loadedPast]) => {
          hasData.current = true;
          setInvitations(loadedInvitations);
          setUpcoming(loadedUpcoming);
          setPast(loadedPast);
          setStatus('ready');
        },
        () => {
          // Keep showing the last lists if a reload fails
          if (!hasData.current) setStatus('error');
        },
      ),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return { invitations, upcoming, past, status, refreshing, refresh };
};
