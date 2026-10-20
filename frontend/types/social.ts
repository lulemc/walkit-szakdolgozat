import type { Route } from '@/services/routeService';

/* ---------------- users & friends ---------------- */

/** A user as shown in social lists: id and name only. Deleted accounts arrive as `{ _id: null, name: 'Deleted user' }`. */
export interface SocialUser {
  _id: string | null;
  name: string;
}

export interface Friend {
  friendshipId: string;
  user: SocialUser;
  since: string;
}

export interface FriendRequest {
  _id: string;
  user: SocialUser;
  createdAt: string;
}

export interface FriendRequests {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface Friendship {
  _id: string;
  requester: string;
  recipient: string;
  status: 'pending' | 'accepted';
  acceptedAt?: string;
  createdAt: string;
}

/** How the logged-in user is related to another user */
export type Relationship = 'none' | 'friends' | 'outgoing' | 'incoming';

/** A user found by search; emails are never returned */
export interface UserSearchResult {
  _id: string;
  name: string;
  relationship: Relationship;
  /** The friendship or pending request, when relationship isn't 'none' */
  friendshipId?: string;
}

/* ---------------- group walks ---------------- */

export type GroupWalkScope = 'invitations' | 'upcoming' | 'past';
export type GroupWalkStatus = 'scheduled' | 'cancelled';
export type ParticipantStatus = 'invited' | 'accepted' | 'declined';
export type ParticipantResponse = Extract<ParticipantStatus, 'accepted' | 'declined'>;

/** The copy of a route stored with a walk (same fields as a saved route) */
export type GroupWalkRoute = Pick<
  Route,
  | 'name'
  | 'type'
  | 'startLocation'
  | 'endLocation'
  | 'coordinates'
  | 'totalDistance'
  | 'estimatedDuration'
  | 'preferences'
  | 'elevationGain'
  | 'elevationLoss'
  | 'maxElevation'
  | 'minElevation'
>;

export interface GroupWalkParticipant {
  user: SocialUser;
  role: 'organiser' | 'invitee';
  status: ParticipantStatus;
  invitedAt?: string;
  respondedAt?: string;
}

export interface GroupWalkCounts {
  accepted: number;
  invited: number;
  declined: number;
}

/** A walk in a list; the route has no coordinates (load the detail for the map) */
export interface GroupWalkSummary {
  _id: string;
  title?: string;
  scheduledAt: string;
  status: GroupWalkStatus;
  organiser: SocialUser;
  route: Omit<GroupWalkRoute, 'coordinates'>;
  myStatus: ParticipantStatus | null;
  counts: GroupWalkCounts;
}

export interface GroupWalkDetail extends Omit<GroupWalkSummary, 'route'> {
  note?: string;
  cancelledAt?: string;
  route: GroupWalkRoute;
  participants: GroupWalkParticipant[];
  isOrganiser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupWalkRequest {
  routeId: string;
  /** ISO time in UTC, e.g. `date.toISOString()`; must be in the future */
  scheduledAt: string;
  title?: string;
  note?: string;
  inviteeIds: string[];
}

export interface UpdateGroupWalkRequest {
  title?: string;
  note?: string;
  scheduledAt?: string;
}

export interface GroupWalkComment {
  _id: string;
  author: SocialUser;
  text: string;
  createdAt: string;
}

export interface CommentPage {
  /** Only comments created before this ISO time (the oldest one already loaded) */
  before?: string;
  limit?: number;
}

/** Counts for the Social tab's badge */
export interface SocialSummary {
  pendingFriendRequests: number;
  pendingInvitations: number;
}
