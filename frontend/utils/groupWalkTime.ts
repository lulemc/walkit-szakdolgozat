import i18n from '@/i18n';
import type { GroupWalkStatus } from '@/types/social';

/** A walk's time (sent in UTC) in the viewer's time zone and language, e.g. "Wed, Jan 2, 2030 · 10:30 AM" */
export const formatWalkTime = (scheduledAt: string): string => {
  const date = new Date(scheduledAt);
  const day = date.toLocaleDateString(i18n.language, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' });
  return i18n.t('social:walkTime', { day, time });
};

/** Whether a walk can still be changed or answered: not cancelled and still ahead (as on the backend) */
export const isWalkOpen = (
  walk: { status: GroupWalkStatus; scheduledAt: string },
  now: Date = new Date(),
): boolean => walk.status === 'scheduled' && new Date(walk.scheduledAt).getTime() > now.getTime();
