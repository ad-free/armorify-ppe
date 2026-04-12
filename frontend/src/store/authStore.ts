// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRead } from '@/types/api';

interface AuthState {
  user: UserRead | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: UserRead, access: string, refresh: string) => void;
  setUser: (user: UserRead) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, access, refresh) => set({ user, accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'armorify-auth',
    }
  )
);
