// src/hooks/useAuth.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginUser, registerUser, getMe } from '@/api/auth';
import type { LoginRequest, RegisterRequest } from '@/types/api';
import { useAuthStore } from '@/store/authStore';

export const useLogin = () => {
  const setAuth = useAuthStore(state => state.setAuth);
  
  return useMutation({
    mutationFn: async (body: LoginRequest) => {
      const tokens = await loginUser(body);
      // after login, we ideally fetch the user profile
      const user = await getMe(); // Requires the auth token to be passed automatically by your fetch interceptor
      setAuth(user, tokens.access_token, tokens.refresh_token);
      return { tokens, user };
    }
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore(state => state.setAuth);
  
  return useMutation({
    mutationFn: async (body: RegisterRequest) => {
      const tokens = await registerUser(body);
      const user = await getMe();
      setAuth(user, tokens.access_token, tokens.refresh_token);
      return { tokens, user };
    }
  });
};

export const useLogout = () => {
  const logout = useAuthStore(state => state.logout);
  const queryClient = useQueryClient();
  
  return () => {
    logout();
    queryClient.clear();
  };
};
