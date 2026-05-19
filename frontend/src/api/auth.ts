// src/api/auth.ts
import { GET, POST } from '@/lib/api';
import type { 
  LoginRequest, 
  RegisterRequest, 
  TokenResponse, 
  UserRead,
  MeUpdate,
  PasswordChangeRequest,
} from '@/types/api';

export const loginUser = (body: LoginRequest) =>
  POST<TokenResponse>('/auth/login', body);

export const registerUser = (body: RegisterRequest) =>
  POST<TokenResponse>('/auth/register', body);

export const getMe = (token?: string) =>
  GET<UserRead>('/auth/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

export const updateMe = (body: MeUpdate) =>
  POST<UserRead>('/auth/me', body, { method: 'PATCH' });

export const changePassword = (body: PasswordChangeRequest) =>
  POST<{ status: string }>('/auth/change-password', body);
