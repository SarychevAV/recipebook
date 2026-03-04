import api from './axios';
import type { ApiResponse, AuthResponse } from '../types/auth';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export const loginApi = (payload: LoginPayload): Promise<ApiResponse<AuthResponse>> =>
  api.post<ApiResponse<AuthResponse>>('/auth/login', payload).then((r) => r.data);

export const registerApi = (payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> =>
  api.post<ApiResponse<AuthResponse>>('/auth/register', payload).then((r) => r.data);

export const getMeApi = (): Promise<ApiResponse<import('../types/auth').UserResponse>> =>
  api.get('/users/me').then((r) => r.data);