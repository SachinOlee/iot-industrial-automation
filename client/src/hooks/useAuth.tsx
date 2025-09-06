// client/src/hooks/useAuth.tsx
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '../types/user';
import ApiService from '../services/api';
import SocketService from '../services/socket';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Verify token is still valid
          const response = await ApiService.getMe();
          if (response.success) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Connect socket
            SocketService.connect(token);
          }
        } catch (error) {
          // Token is invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();

    return () => {
      SocketService.disconnect();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await ApiService.login({ email, password });
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        
        // Connect socket
        SocketService.connect(response.token);
        
        toast.success('Login successful!');
        return true;
      } else {
        toast.error(response.message || 'Login failed');
        return false;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Client-side password confirmation check
      if (data.password !== data.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }

      const response = await ApiService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
      });
      
      if (response.success) {
        toast.success('Registration successful! Please check your email to verify your account.');
        return true;
      } else {
        toast.error(response.message || 'Registration failed');
        return false;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear user state
      setUser(null);
      
      // Disconnect socket
      SocketService.disconnect();
      
      // Call logout API (optional, for server-side cleanup)
      // Note: logout API method not implemented in ApiService
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      SocketService.disconnect();
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await ApiService.forgotPassword(email);
      
      if (response.success) {
        toast.success('Password reset email sent! Please check your inbox.');
        return true;
      } else {
        toast.error(response.message || 'Failed to send reset email');
        return false;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    token: string, 
    password: string, 
    confirmPassword: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Client-side password confirmation check
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }

      const response = await ApiService.resetPassword(token, password, confirmPassword);
      
      if (response.success) {
        // Auto-login after successful password reset
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        
        // Connect socket
        SocketService.connect(response.token);
        
        toast.success('Password reset successful!');
        return true;
      } else {
        toast.error(response.message || 'Password reset failed');
        return false;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password reset failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};