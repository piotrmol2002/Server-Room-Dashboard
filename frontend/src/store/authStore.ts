import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const response = await authApi.login({ username, password });
        const { access_token } = response.data;

        localStorage.setItem('token', access_token);

        // Fetch user data
        const userResponse = await authApi.getMe();

        set({
          token: access_token,
          user: userResponse.data,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      fetchUser: async () => {
        const token = get().token;
        if (!token) return;

        try {
          const response = await authApi.getMe();
          set({ user: response.data, isAuthenticated: true });
        } catch (error) {
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
