import type { GroupWalkCounts, ParticipantStatus } from "@/types/social";

export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  invited: "Invited",
  accepted: "Going",
  declined: "Declined",
};

/** e.g. "2 going · 1 invited"; declined people are left out */
export const countsLabel = ({ accepted, invited }: GroupWalkCounts): string =>
  [`${accepted} going`, invited > 0 ? `${invited} invited` : null].filter(Boolean).join(" · ");
