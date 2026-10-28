import * as Notifications from 'expo-notifications';
import { REMINDER_BEFORE_MS, syncWalkReminders } from '../walkReminders';
import type { GroupWalkSummary } from '@/types/social';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

const notifications = Notifications as jest.Mocked<typeof Notifications>;
const NOW = new Date(2030, 0, 2, 12, 0);
const walk = (overrides: Partial<GroupWalkSummary> = {}) =>
  ({
    _id: 'w1',
    title: 'Sunday hike',
    scheduledAt: new Date(2030, 0, 5, 10, 0).toISOString(),
    status: 'scheduled',
    myStatus: 'accepted',
    ...overrides,
  }) as GroupWalkSummary;
const scheduled = (identifier: string) => ({ identifier, content: {}, trigger: null }) as never;

beforeEach(() => {
  jest.clearAllMocks();
  notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
  notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
});

describe('syncWalkReminders', () => {
  it("reminds me an hour before each walk I'm coming to", async () => {
    await syncWalkReminders([walk()], NOW);

    expect(REMINDER_BEFORE_MS).toBe(60 * 60 * 1000);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'walk-reminder-w1',
      content: {
        title: 'Group walk in 1 hour',
        body: '“Sunday hike” starts at 10:00 AM',
        data: { type: 'walkReminder', walkId: 'w1' },
      },
      trigger: { type: 'date', date: new Date(2030, 0, 5, 9, 0) },
    });
  });

  it('names a walk without a title as my group walk', async () => {
    await syncWalkReminders([walk({ title: undefined })], NOW);

    expect(notifications.scheduleNotificationAsync.mock.calls[0][0].content.body).toBe(
      'Your group walk starts at 10:00 AM',
    );
  });

  it("doesn't remind about walks I haven't accepted, cancelled walks, or walks less than an hour away", async () => {
    await syncWalkReminders(
      [
        walk({ _id: 'invited', myStatus: 'invited' }),
        walk({ _id: 'cancelled', status: 'cancelled' }),
        walk({ _id: 'soon', scheduledAt: new Date(2030, 0, 2, 12, 30).toISOString() }),
      ],
      NOW,
    );

    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("removes reminders of walks that aren't upcoming any more, and leaves other notifications alone", async () => {
    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      scheduled('walk-reminder-w1'),
      scheduled('walk-reminder-old'),
      scheduled('something-else'),
    ]);

    await syncWalkReminders([walk()], NOW);

    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('walk-reminder-old');
  });

  it("doesn't ask for permission; without it nothing is scheduled", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' } as never);

    await syncWalkReminders([walk()], NOW);

    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('never fails the screen that loaded the walks', async () => {
    notifications.scheduleNotificationAsync.mockRejectedValue(new Error('not available'));

    await expect(syncWalkReminders([walk()], NOW)).resolves.toBeUndefined();
  });
});
