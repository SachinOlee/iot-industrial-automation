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

  // Extended profile fields
  profileImage?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  bio?: string;
  preferences?: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
    temperatureUnit: 'celsius' | 'fahrenheit';
  };
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