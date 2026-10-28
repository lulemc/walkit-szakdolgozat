import i18n from "@/i18n";
import type { GroupWalkCounts, ParticipantStatus } from "@/types/social";

/** A participant's answer, e.g. "Going" (translated when called) */
export const participantStatusLabel = (status: ParticipantStatus): string =>
  i18n.t(`social:status.${status}`);

/** e.g. "2 going · 1 invited"; declined people are left out */
export const countsLabel = ({ accepted, invited }: GroupWalkCounts): string =>
  [
    i18n.t("social:counts.going", { accepted }),
    invited > 0 ? i18n.t("social:counts.invited", { invited }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
