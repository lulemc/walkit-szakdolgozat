import { useCallback, useEffect, useState } from 'react';
import { groupWalkService } from '@/services/groupWalkService';
import type { GroupWalkComment } from '@/types/social';
import { apiErrorMessage } from '@/utils/apiError';

export const COMMENT_PAGE_SIZE = 20;

export type CommentsStatus = 'loading' | 'ready' | 'error';

/** The server sends newest first; the list shows oldest first, like a chat */
const oldestFirst = (page: GroupWalkComment[]) => [...page].reverse();

/**
 * A group walk's comments: the newest page first, older pages on request.
 * Actions resolve with true when they worked, or false with actionError set.
 */
export const useGroupWalkComments = (walkId: string) => {
  const [comments, setComments] = useState<GroupWalkComment[]>([]);
  const [status, setStatus] = useState<CommentsStatus>('loading');
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [posting, setPosting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // State is only updated in the promise callbacks, after the request finished
  const reload = useCallback(
    () =>
      groupWalkService.listComments(walkId, { limit: COMMENT_PAGE_SIZE }).then(
        (page) => {
          setComments(oldestFirst(page));
          // A full page means there may be older comments
          setHasOlder(page.length === COMMENT_PAGE_SIZE);
          setStatus('ready');
        },
        () => setStatus('error'),
      ),
    [walkId],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const loadOlder = useCallback(async () => {
    const oldest = comments[0];
    if (!oldest) return;
    setLoadingOlder(true);
    setActionError(null);
    try {
      const page = await groupWalkService.listComments(walkId, {
        before: oldest.createdAt,
        limit: COMMENT_PAGE_SIZE,
      });
      setComments((current) => [...oldestFirst(page), ...current]);
      setHasOlder(page.length === COMMENT_PAGE_SIZE);
    } catch (error) {
      setActionError(apiErrorMessage(error));
    } finally {
      setLoadingOlder(false);
    }
  }, [comments, walkId]);

  const add = useCallback(
    async (text: string): Promise<boolean> => {
      setPosting(true);
      setActionError(null);
      try {
        const comment = await groupWalkService.addComment(walkId, text);
        setComments((current) => [...current, comment]);
        return true;
      } catch (error) {
        setActionError(apiErrorMessage(error));
        return false;
      } finally {
        setPosting(false);
      }
    },
    [walkId],
  );

  const remove = useCallback(
    async (commentId: string): Promise<boolean> => {
      setActionError(null);
      try {
        await groupWalkService.deleteComment(walkId, commentId);
        setComments((current) => current.filter((comment) => comment._id !== commentId));
        return true;
      } catch (error) {
        setActionError(apiErrorMessage(error));
        return false;
      }
    },
    [walkId],
  );

  return {
    comments,
    status,
    hasOlder,
    loadingOlder,
    posting,
    actionError,
    reload,
    loadOlder,
    add,
    remove,
  };
};
