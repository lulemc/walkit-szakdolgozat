import { useCallback, useEffect, useState } from 'react';
import { walkService } from '@/services/walkService';
import type { Walk } from '@/types/walk';

export type WalkDetailStatus = 'loading' | 'ready' | 'error';

/** One of my walks, with its path */
export const useWalkDetail = (walkId: string) => {
  const [walk, setWalk] = useState<Walk | null>(null);
  const [status, setStatus] = useState<WalkDetailStatus>('loading');

  // State is only updated in the promise callbacks, after the request finished
  const load = useCallback(
    () =>
      walkService.get(walkId).then(
        (loaded) => {
          setWalk(loaded);
          setStatus('ready');
        },
        () => setStatus('error'),
      ),
    [walkId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const retry = useCallback(() => {
    setStatus('loading');
    return load();
  }, [load]);

  return { walk, status, retry };
};
