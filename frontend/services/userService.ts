import api from "./api";
import type { ApiResponse } from "@/types/api";
import type { UserSearchResult } from "@/types/social";

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

  // GET user by ID
  getById: async (id:string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // UPDATE user
  updateUserProfile: async (id:string, updatedData:UpdateUserData) => {
    const response = await api.put(`/users/${id}`, updatedData);
    return response.data;
  },

   changePassword: async (id: string, passwordData: ChangePasswordData) => {
    const response = await api.post(`/users/${id}/change-password`, passwordData);
    return response.data;
  },
  
  // DELETE user
  delete: async (id:string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export default UserService;
