import api from '../api';
import UserService, { UpdateUserData, ChangePasswordData } from '../userService';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('should get user by id successfully', async () => {
      const mockUser = { _id: '123', name: 'John Doe', email: 'john@test.com' };

      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await UserService.getById('123');

      expect(mockedApi.get).toHaveBeenCalledWith('/users/123');
      expect(result).toEqual(mockUser);
    });

    it('should handle error when user not found', async () => {
      const mockError = new Error('User not found');
      mockedApi.get.mockRejectedValue(mockError);

      await expect(UserService.getById('invalid-id')).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = '123';
      const updateData: UpdateUserData = {
        name: 'Updated Name',
        height: 180,
        weight: 75,
        activityLevel: 'moderately_active',
      };

      const mockResponse = {
        message: 'User updated successfully',
        user: {
          _id: userId,
          name: 'Updated Name',
          height: 180,
          weight: 75,
          activityLevel: 'moderately_active',
        },
      };

      mockedApi.put.mockResolvedValue({ data: mockResponse });

      const result = await UserService.updateUserProfile(userId, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith(`/users/${userId}`, updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when updating user profile', async () => {
      const userId = '123';
      const updateData: UpdateUserData = {
        name: 'Updated Name',
      };

      const mockError = new Error('Failed to update profile');
      mockedApi.put.mockRejectedValue(mockError);

      await expect(UserService.updateUserProfile(userId, updateData)).rejects.toThrow('Failed to update profile');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = '123';
      const passwordData: ChangePasswordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      const mockResponse = {
        message: 'Password changed successfully',
      };

      mockedApi.post.mockResolvedValue({ data: mockResponse });

      const result = await UserService.changePassword(userId, passwordData);

      expect(mockedApi.post).toHaveBeenCalledWith(`/users/${userId}/change-password`, passwordData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when current password is incorrect', async () => {
      const userId = '123';
      const passwordData: ChangePasswordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      };

      const mockError = {
        response: {
          data: {
            message: 'Current password is incorrect',
          },
        },
      };

      mockedApi.post.mockRejectedValue(mockError);

      await expect(UserService.changePassword(userId, passwordData)).rejects.toEqual(mockError);
    });

    it('should handle error when new password is same as current', async () => {
      const userId = '123';
      const passwordData: ChangePasswordData = {
        currentPassword: 'password123',
        newPassword: 'password123',
      };

      const mockError = {
        response: {
          data: {
            message: 'New password must be different from current password',
          },
        },
      };

      mockedApi.post.mockRejectedValue(mockError);

      await expect(UserService.changePassword(userId, passwordData)).rejects.toEqual(mockError);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const userId = '123';
      const mockResponse = {
        message: 'User deleted',
      };

      mockedApi.delete.mockResolvedValue({ data: mockResponse });

      const result = await UserService.delete(userId);

      expect(mockedApi.delete).toHaveBeenCalledWith(`/users/${userId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when deleting user', async () => {
      const userId = '123';
      const mockError = new Error('Failed to delete user');
      mockedApi.delete.mockRejectedValue(mockError);

      await expect(UserService.delete(userId)).rejects.toThrow('Failed to delete user');
    });
  });
});