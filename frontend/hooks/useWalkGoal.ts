import { useCallback, useEffect, useState } from 'react';
import { walkService } from '@/services/walkService';
import UserService from '@/services/userService';
import { useAuth } from '@/context/AuthProvider';
import { userStorage } from '@/utils/userStorage';
import { startOfLocalWeek } from '@/utils/walkMetrics';
import type { WalkActivity } from '@/types/walk';
import {
  DEFAULT_WEEKLY_GOAL_KM,
  STREAK_LOOKBACK_WEEKS,
  distanceThisWeekM,
  weeklyStreak,
  weeksBefore,
} from '@/utils/walkGoals';

/**
 * The weekly walking goal, how far I've walked this week and my streak of
 * weeks with a walk; reloads whenever a walk is saved
 */
export const useWalkGoal = (now: Date = new Date()) => {
  const { user } = useAuth();
  const [from] = useState(() => weeksBefore(startOfLocalWeek(now), STREAK_LOOKBACK_WEEKS).toISOString());
  const [activity, setActivity] = useState<WalkActivity[] | null>(null);
  const [savedGoalKm, setSavedGoalKm] = useState<number | null>(null);

  // State is only updated in the promise callback, after the request finished
  const load = useCallback(
    () =>
      walkService.activity(from).then(setActivity, () => {
        // Leave the last walks (or none) in place
      }),
    [from],
  );

  useEffect(() => {
    load();
    return walkService.onWalkSaved(() => {
      load();
    });
  }, [load]);

  /** Saves the goal on the profile; throws if that fails, so the caller can say so */
  const saveGoal = useCallback(
    async (km: number) => {
      if (!user) return;
      const updated = await UserService.updateUserProfile(user._id, { weeklyGoalKm: km });
      await userStorage.setUser(updated);
      setSavedGoalKm(updated.weeklyGoalKm ?? km);
    },
    [user],
  );

  return {
    goalKm: savedGoalKm ?? user?.weeklyGoalKm ?? DEFAULT_WEEKLY_GOAL_KM,
    thisWeekM: activity ? distanceThisWeekM(activity, now) : 0,
    streak: activity ? weeklyStreak(activity, now) : 0,
    loaded: activity !== null,
    saveGoal,
  };
};
