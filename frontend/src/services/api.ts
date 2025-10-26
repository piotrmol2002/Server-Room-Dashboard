import axios from 'axios';
import type {
  User,
  Server,
  Environment,
  Alert,
  ScheduledTask,
  LoginRequest,
  RegisterRequest,
  AuthResponse
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/api/auth/login', data),
  register: (data: RegisterRequest) => api.post<User>('/api/auth/register', data),
  getMe: () => api.get<User>('/api/auth/me'),
};

// Users API
export const usersApi = {
  getAll: () => api.get<User[]>('/api/users'),
  getById: (id: number) => api.get<User>(`/api/users/${id}`),
  update: (id: number, data: Partial<User>) => api.patch<User>(`/api/users/${id}`, data),
  delete: (id: number) => api.delete(`/api/users/${id}`),
};

// Servers API
export const serversApi = {
  getAll: () => api.get<Server[]>('/api/servers'),
  getById: (id: number) => api.get<Server>(`/api/servers/${id}`),
  create: (data: Partial<Server>) => api.post<Server>('/api/servers', data),
  update: (id: number, data: Partial<Server>) => api.patch<Server>(`/api/servers/${id}`, data),
  delete: (id: number) => api.delete(`/api/servers/${id}`),
  restart: (id: number) => api.post(`/api/servers/${id}/restart`),
};

// Environment API
export const environmentApi = {
  get: () => api.get<Environment>('/api/environment'),
  update: (data: Partial<Environment>) => api.patch<Environment>('/api/environment', data),
};

// Alerts API
export const alertsApi = {
  getAll: (unread_only = false) => api.get<Alert[]>('/api/alerts', { params: { unread_only } }),
  getById: (id: number) => api.get<Alert>(`/api/alerts/${id}`),
  markRead: (id: number) => api.patch<Alert>(`/api/alerts/${id}/read`),
  delete: (id: number) => api.delete(`/api/alerts/${id}`),
};

// Scheduled Tasks API
export const tasksApi = {
  getAll: () => api.get<ScheduledTask[]>('/api/tasks'),
  getById: (id: number) => api.get<ScheduledTask>(`/api/tasks/${id}`),
  create: (data: Partial<ScheduledTask>) => api.post<ScheduledTask>('/api/tasks', data),
  update: (id: number, data: Partial<ScheduledTask>) => api.patch<ScheduledTask>(`/api/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/api/tasks/${id}`),
  execute: (id: number) => api.post(`/api/tasks/${id}/execute`),
};

export default api;
