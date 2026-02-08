import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/types/User';

export const userStorage = {
  getUser: async (): Promise<User | null> => {
    if (Platform.OS === 'web') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    const user = await SecureStore.getItemAsync('user');
    return user ? JSON.parse(user) : null
  },

  setUser: async (user: User) => {
    if (Platform.OS === 'web') {
      return localStorage.setItem('user', JSON.stringify(user));
      
    }
    return await SecureStore.setItemAsync('user', JSON.stringify(user));
  },
  
   removeUser: async () => {
      if (Platform.OS === 'web') {
        localStorage.removeItem('user');
        return;
      }
      await SecureStore.deleteItemAsync('user');
    },
};
