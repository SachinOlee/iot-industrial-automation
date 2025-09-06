// client/src/types/user.ts
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin' | 'operator';
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  isActive?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: {
    user: User;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}