import { useCallback, useEffect, useRef, useState } from 'react';
import { friendService } from '@/services/friendService';
import { useSocialSummary } from '@/context/SocialSummaryProvider';
import type { Friend, FriendRequests, Friendship } from '@/types/social';
import { apiErrorMessage } from '@/utils/apiError';

export type FriendsStatus = 'loading' | 'ready' | 'error';

const NO_REQUESTS: FriendRequests = { incoming: [], outgoing: [] };

/**
 * Friends and pending friend requests, plus the actions on them. After every
 * successful action the lists are reloaded and the Social badge refreshed.
 */
export const useFriends = () => {
  const { refresh: refreshSummary } = useSocialSummary();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequests>(NO_REQUESTS);
  const [status, setStatus] = useState<FriendsStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const hasData = useRef(false);

  // State is only updated in the promise callbacks, after the requests finished
  const load = useCallback(
    () =>
      Promise.all([friendService.listFriends(), friendService.listRequests()]).then(
        ([loadedFriends, loadedRequests]) => {
          hasData.current = true;
          setFriends(loadedFriends);
          setRequests(loadedRequests);
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

  /** Runs an action; resolves with its result, or null (with actionError set) if it failed */
  const runAction = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | null> => {
      setActionError(null);
      let result: T;
      try {
        result = await action();
      } catch (error) {
        setActionError(apiErrorMessage(error));
        return null;
      }
      await Promise.all([load(), refreshSummary()]);
      return result;
    },
    [load, refreshSummary],
  );

  const accept = useCallback(
    (requestId: string) => runAction(() => friendService.acceptRequest(requestId)),
    [runAction],
  );
  const decline = useCallback(
    (requestId: string) => runAction(() => friendService.declineRequest(requestId)),
    [runAction],
  );
  const cancel = useCallback(
    (requestId: string) => runAction(() => friendService.cancelRequest(requestId)),
    [runAction],
  );
  const unfriend = useCallback(
    (userId: string) => runAction(() => friendService.unfriend(userId)),
    [runAction],
  );
  /** Resolves with the friendship: accepted straight away if they had already asked me */
  const sendRequest = useCallback(
    (userId: string): Promise<Friendship | null> =>
      runAction(() => friendService.sendRequest(userId)),
    [runAction],
  );

  return {
    friends,
    requests,
    status,
    refreshing,
    actionError,
    refresh,
    accept,
    decline,
    cancel,
    unfriend,
    sendRequest,
  };
};
