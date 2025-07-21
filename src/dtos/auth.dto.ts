export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email?: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
  message?: string;
}
