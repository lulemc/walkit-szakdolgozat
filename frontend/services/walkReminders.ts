import * as Notifications from 'expo-notifications';
import i18n from '@/i18n';
import type { GroupWalkSummary } from '@/types/social';

export const REMINDER_BEFORE_MS = 60 * 60 * 1000;
const ID_PREFIX = 'walk-reminder-';

const reminderText = (walk: GroupWalkSummary) => {
  const time = new Date(walk.scheduledAt).toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' });
  return {
    title: i18n.t('social:reminder.title'),
    body: walk.title
      ? i18n.t('social:reminder.body', { title: walk.title, time })
      : i18n.t('social:reminder.bodyUntitled', { time }),
  };
};

/**
 * Keeps a local notification an hour before every upcoming walk I'm coming
 * to, and removes the reminders of walks I left or that were cancelled or
 * moved. Called whenever the upcoming walks are loaded; never fails.
 */
export const syncWalkReminders = async (upcoming: GroupWalkSummary[], now: Date = new Date()): Promise<void> => {
  try {
    // Permission is asked for at login (push notifications); without it there are no reminders
    if ((await Notifications.getPermissionsAsync()).status !== 'granted') return;

    const wanted = upcoming
      .filter((walk) => walk.status === 'scheduled' && walk.myStatus === 'accepted')
      .map((walk) => ({ walk, at: new Date(new Date(walk.scheduledAt).getTime() - REMINDER_BEFORE_MS) }))
      .filter(({ at }) => at.getTime() > now.getTime());
    const wantedIds = new Set(wanted.map(({ walk }) => ID_PREFIX + walk._id));

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const { identifier } of scheduled) {
      if (identifier.startsWith(ID_PREFIX) && !wantedIds.has(identifier)) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }
    }

    // The same identifier replaces the reminder, so a moved walk gets the new time
    for (const { walk, at } of wanted) {
      await Notifications.scheduleNotificationAsync({
        identifier: ID_PREFIX + walk._id,
        content: { ...reminderText(walk), data: { type: 'walkReminder', walkId: walk._id } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
    }
  } catch {
    // Reminders are a nice extra; the walks are on screen either way
  }
};
