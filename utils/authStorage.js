import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@motimates:auth';
const USER_KEY = '@motimates:user';

export const authStorage = {
  async setAuth(authData) {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  },

  async getAuth() {
    try {
      const authData = await AsyncStorage.getItem(AUTH_KEY);
      return authData ? JSON.parse(authData) : null;
    } catch (error) {
      console.error('Error getting auth data:', error);
      return null;
    }
  },

  async clearAuth() {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  async setUser(userData) {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  },

  async getUser() {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },
};
