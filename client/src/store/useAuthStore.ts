import { create } from 'zustand';
import type { User } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, nickname?: string, phone?: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Pick<User, 'nickname' | 'phone' | 'address'>>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await api.login({ username, password });
      api.setToken(res.token);
      set({ user: res.user, token: res.token, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  register: async (username: string, password: string, nickname?: string, phone?: string) => {
    set({ isLoading: true });
    try {
      const res = await api.register({ username, password, nickname, phone });
      api.setToken(res.token);
      set({ user: res.user, token: res.token, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: () => {
    api.clearToken();
    set({ user: null, token: null });
  },

  fetchProfile: async () => {
    if (!get().token) return;
    set({ isLoading: true });
    try {
      const user = await api.getProfile();
      set({ user, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true });
    try {
      const user = await api.updateProfile(data);
      set({ user, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },
}));
