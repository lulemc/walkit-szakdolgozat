import api from "./api";
import type { ApiResponse } from "@/types/api";
import type { UserSearchResult } from "@/types/social";
import type { User } from "@/types/User";

export interface UpdateUserData {
  name?: string;
  dateOfBirth?: string;
  sex?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}
const UserService = {
  // Search other users by name, or by exact email when the query contains "@"
  searchUsers: async (q: string): Promise<UserSearchResult[]> => {
    const response = await api.get<ApiResponse<UserSearchResult[]>>("/users/search", {
      params: { q },
    });
    return response.data.data;
  },

  // GET my profile
  getById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  // UPDATE my profile; resolves with the updated user
  updateUserProfile: async (id: string, updatedData: UpdateUserData): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, updatedData);
    return response.data.data;
  },

  // Resolves with the new token; every other session is logged out
  changePassword: async (id: string, passwordData: ChangePasswordData): Promise<{ token: string }> => {
    const response = await api.post<ApiResponse<{ token: string }>>(
      `/users/${id}/change-password`,
      passwordData,
    );
    return response.data.data;
  },
  
  // DELETE user
  delete: async (id:string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export default UserService;
