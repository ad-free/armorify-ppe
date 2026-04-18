// src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserRead } from '@/types/api';

interface AuthState {
  user: UserRead | null;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setAuth: (user: UserRead, access: string, refresh: string) => void;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: UserRead) => void;
  setHasHydrated: (state: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,
      setAuth: (user, access, refresh) => set({ user, accessToken: access, refreshToken: refresh }),
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'armorify-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
