// client/src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('An error occurred. Please try again.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.api.post('/auth/forgotpassword', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string, confirmPassword: string) {
    const response = await this.api.put(`/auth/resetpassword/${token}`, {
      password,
      confirmPassword,
    });
    return response.data;
  }

  async verifyEmail(token: string) {
    const response = await this.api.get(`/auth/verify-email/${token}`);
    return response.data;
  }

  async getMe() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Sensor data endpoints
  async addSensorData(data: {
    machineId: string;
    motorSpeed: number;
    voltage: number;
    temperature: number;
    heat: number;
    workingStatus: boolean;
    workingPeriod: number;
  }) {
    const response = await this.api.post('/sensor/data', data);
    return response.data;
  }

  async getSensorData(params?: {
    page?: number;
    limit?: number;
    machineId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.api.get('/sensor/data', { params });
    return response.data;
  }

  async getLatestSensorData() {
    const response = await this.api.get('/sensor/latest');
    return response.data;
  }

  async getSensorAnalytics(params?: {
    machineId?: string;
    period?: '24h' | '7d' | '30d';
  }) {
    const response = await this.api.get('/sensor/analytics', { params });
    return response.data;
  }

  // Maintenance alerts endpoints
  async getMaintenanceAlerts(params?: {
    page?: number;
    limit?: number;
    resolved?: boolean;
    severity?: string;
  }) {
    const response = await this.api.get('/sensor/alerts', { params });
    return response.data;
  }

  async resolveAlert(alertId: string) {
    const response = await this.api.put(`/sensor/alerts/${alertId}/resolve`);
    return response.data;
  }

  // Admin endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const response = await this.api.get('/admin/users', { params });
    return response.data;
  }

  async getUserById(userId: string) {
    const response = await this.api.get(`/admin/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
  }) {
    const response = await this.api.put(`/admin/users/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async getSystemStats() {
    const response = await this.api.get('/admin/stats');
    return response.data;
  }

  async getAllSensorData(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    machineId?: string;
  }) {
    const response = await this.api.get('/admin/sensor-data', { params });
    return response.data;
  }

  async getAllAlerts(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    severity?: string;
    resolved?: boolean;
  }) {
    const response = await this.api.get('/admin/alerts', { params });
    return response.data;
  }
}

export default new ApiService();