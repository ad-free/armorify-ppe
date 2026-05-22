import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginUser, registerUser, getMe, updateMe, changePassword } from '@/api/auth';
import type { LoginRequest, RegisterRequest, MeUpdate, PasswordChangeRequest } from '@/types/api';
import { useAuthStore } from '@/store/authStore';

export const useLogin = () => {
  const setAuth = useAuthStore(state => state.setAuth);
  
  return useMutation({
    mutationFn: async (body: LoginRequest) => {
      const tokens = await loginUser(body);
      const user = await getMe(tokens.access_token);
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
      const user = await getMe(tokens.access_token);
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

export const useUpdateMe = () => {
  const setUser = useAuthStore(state => state.setUser);
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (body: MeUpdate) => updateMe(body),
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    }
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (body: PasswordChangeRequest) => changePassword(body)
  });
};
