import { useCallback, useEffect, useRef, useState } from 'react';
import { groupWalkService } from '@/services/groupWalkService';
import { useSocialSummary } from '@/context/SocialSummaryProvider';
import type { GroupWalkDetail, ParticipantResponse, UpdateGroupWalkRequest } from '@/types/social';
import { apiErrorMessage } from '@/utils/apiError';

export type GroupWalkLoadStatus = 'loading' | 'ready' | 'error';

/**
 * One group walk and the actions on it. Every action resolves with true when it
 * worked, or false with actionError set.
 */
export const useGroupWalk = (walkId: string) => {
  const { refresh: refreshSummary } = useSocialSummary();
  const [walk, setWalk] = useState<GroupWalkDetail | null>(null);
  const [status, setStatus] = useState<GroupWalkLoadStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const hasData = useRef(false);

  // State is only updated in the promise callbacks, after the request finished
  const load = useCallback(
    () =>
      groupWalkService.get(walkId).then(
        (loaded) => {
          hasData.current = true;
          setWalk(loaded);
          setStatus('ready');
        },
        () => {
          // Keep showing the walk if a reload fails
          if (!hasData.current) setStatus('error');
        },
      ),
    [walkId],
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

  const runAction = useCallback(async (action: () => Promise<unknown>): Promise<boolean> => {
    setActionError(null);
    setBusy(true);
    try {
      await action();
      return true;
    } catch (error) {
      setActionError(apiErrorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  /** Accept or decline; declining after accepting is how an invitee leaves */
  const respond = useCallback(
    (response: ParticipantResponse) =>
      runAction(async () => {
        await groupWalkService.respond(walkId, response);
        // The answer changes the participant list and the invitation count on the badge
        await Promise.all([load(), refreshSummary()]);
      }),
    [runAction, walkId, load, refreshSummary],
  );

  // Organiser changes send back the updated walk
  const update = useCallback(
    (changes: UpdateGroupWalkRequest) =>
      runAction(async () => setWalk(await groupWalkService.update(walkId, changes))),
    [runAction, walkId],
  );
  const cancel = useCallback(
    () => runAction(async () => setWalk(await groupWalkService.cancel(walkId))),
    [runAction, walkId],
  );
  const invite = useCallback(
    (userIds: string[]) =>
      runAction(async () => setWalk(await groupWalkService.invite(walkId, userIds))),
    [runAction, walkId],
  );
  const removeParticipant = useCallback(
    (userId: string) =>
      runAction(async () => setWalk(await groupWalkService.removeParticipant(walkId, userId))),
    [runAction, walkId],
  );

  return {
    walk,
    status,
    refreshing,
    busy,
    actionError,
    refresh,
    respond,
    update,
    cancel,
    invite,
    removeParticipant,
  };
};
