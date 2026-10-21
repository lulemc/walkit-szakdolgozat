import { useCallback, useEffect, useState } from 'react';
import { walkService } from '@/services/walkService';
import type { WalkStats } from '@/types/walk';
import { startOfLocalWeek } from '@/utils/walkMetrics';

/**
 * This week's WalkIt walks (from Monday, local time); reloads whenever a walk
 * is saved. `stats` stays null until loaded, or if loading fails.
 */
export const useWalkStats = (now: Date = new Date()) => {
  const [from] = useState(() => startOfLocalWeek(now).toISOString());
  const [stats, setStats] = useState<WalkStats | null>(null);

  // State is only updated in the promise callback, after the request finished
  const load = useCallback(
    () =>
      walkService.stats({ from }).then(setStats, () => {
        // Leave the last totals (or none) in place
      }),
    [from],
  );

  useEffect(() => {
    load();
    return walkService.onWalkSaved(() => {
      load();
    });
  }, [load]);

  return { stats, reload: load };
};
