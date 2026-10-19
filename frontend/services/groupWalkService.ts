import api from './api';
import type { ApiResponse } from '@/types/api';
import type {
  CommentPage,
  CreateGroupWalkRequest,
  GroupWalkComment,
  GroupWalkDetail,
  GroupWalkScope,
  GroupWalkSummary,
  ParticipantResponse,
  SocialSummary,
  UpdateGroupWalkRequest,
} from '@/types/social';

const unwrap = <T>(response: { data: ApiResponse<T> }) => response.data.data;

export const groupWalkService = {
  async list(scope: GroupWalkScope): Promise<GroupWalkSummary[]> {
    return unwrap(await api.get<ApiResponse<GroupWalkSummary[]>>('/group-walks', { params: { scope } }));
  },

  async get(walkId: string): Promise<GroupWalkDetail> {
    return unwrap(await api.get<ApiResponse<GroupWalkDetail>>(`/group-walks/${walkId}`));
  },

  async create(request: CreateGroupWalkRequest): Promise<GroupWalkDetail> {
    return unwrap(await api.post<ApiResponse<GroupWalkDetail>>('/group-walks', request));
  },

  async update(walkId: string, changes: UpdateGroupWalkRequest): Promise<GroupWalkDetail> {
    return unwrap(await api.patch<ApiResponse<GroupWalkDetail>>(`/group-walks/${walkId}`, changes));
  },

  async cancel(walkId: string): Promise<GroupWalkDetail> {
    return unwrap(await api.post<ApiResponse<GroupWalkDetail>>(`/group-walks/${walkId}/cancel`));
  },

  async invite(walkId: string, userIds: string[]): Promise<GroupWalkDetail> {
    return unwrap(
      await api.post<ApiResponse<GroupWalkDetail>>(`/group-walks/${walkId}/invites`, { userIds }),
    );
  },

  async removeParticipant(walkId: string, userId: string): Promise<GroupWalkDetail> {
    return unwrap(
      await api.delete<ApiResponse<GroupWalkDetail>>(`/group-walks/${walkId}/participants/${userId}`),
    );
  },

  async respond(walkId: string, status: ParticipantResponse): Promise<{ myStatus: ParticipantResponse }> {
    return unwrap(
      await api.post<ApiResponse<{ myStatus: ParticipantResponse }>>(`/group-walks/${walkId}/respond`, {
        status,
      }),
    );
  },

  /** Newest first; pass the oldest loaded comment's createdAt as `before` to load older ones */
  async listComments(walkId: string, page: CommentPage = {}): Promise<GroupWalkComment[]> {
    return unwrap(
      await api.get<ApiResponse<GroupWalkComment[]>>(`/group-walks/${walkId}/comments`, { params: page }),
    );
  },

  async addComment(walkId: string, text: string): Promise<GroupWalkComment> {
    return unwrap(
      await api.post<ApiResponse<GroupWalkComment>>(`/group-walks/${walkId}/comments`, { text }),
    );
  },

  async deleteComment(walkId: string, commentId: string): Promise<void> {
    await api.delete(`/group-walks/${walkId}/comments/${commentId}`);
  },

  /** Pending friend requests and walk invitations, for the Social badge */
  async getSummary(): Promise<SocialSummary> {
    return unwrap(await api.get<ApiResponse<SocialSummary>>('/group-walks/summary'));
  },
};
