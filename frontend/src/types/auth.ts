export type Role = 'USER' | 'ADMIN';

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  timestamp: string;
}