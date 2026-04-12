// src/api/auth.ts
import { GET, POST } from '@/lib/api';
import type { 
  LoginRequest, 
  RegisterRequest, 
  TokenResponse, 
  UserRead 
} from '@/types/api';

export const loginUser = (body: LoginRequest) =>
  POST<TokenResponse>('/auth/login', body);

export const registerUser = (body: RegisterRequest) =>
  POST<TokenResponse>('/auth/register', body);

export const getMe = () =>
  GET<UserRead>('/auth/me');
