import api from './api';
import type { ApiResponse } from '@/types/api';
import type { Friend, FriendRequests, Friendship } from '@/types/social';

export const friendService = {
  async listFriends(): Promise<Friend[]> {
    const response = await api.get<ApiResponse<Friend[]>>('/friends');
    return response.data.data;
  },

  async listRequests(): Promise<FriendRequests> {
    const response = await api.get<ApiResponse<FriendRequests>>('/friends/requests');
    return response.data.data;
  },

  /** If the other user had already asked me, the result is an accepted friendship */
  async sendRequest(userId: string): Promise<Friendship> {
    const response = await api.post<ApiResponse<Friendship>>('/friends/requests', { userId });
    return response.data.data;
  },

  async acceptRequest(requestId: string): Promise<Friendship> {
    const response = await api.post<ApiResponse<Friendship>>(`/friends/requests/${requestId}/accept`);
    return response.data.data;
  },

  async declineRequest(requestId: string): Promise<void> {
    await api.post(`/friends/requests/${requestId}/decline`);
  },

  async cancelRequest(requestId: string): Promise<void> {
    await api.delete(`/friends/requests/${requestId}`);
  },

  async unfriend(userId: string): Promise<void> {
    await api.delete(`/friends/${userId}`);
  },
};
