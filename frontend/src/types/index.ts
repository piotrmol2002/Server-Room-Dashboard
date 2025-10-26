export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  MONITOR = 'monitor',
  TECHNIK = 'technik',
}

export enum ServerStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
}

export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum TaskType {
  BACKUP = 'backup',
  RESTART = 'restart',
  MAINTENANCE = 'maintenance',
  DIAGNOSTIC = 'diagnostic',
  UPDATE = 'update',
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Server {
  id: number;
  name: string;
  ip_address?: string;
  status: ServerStatus;
  cpu_usage: number;
  ram_usage: number;
  temperature: number;
  uptime: number;
  created_at: string;
  updated_at?: string;
}

export interface Environment {
  id: number;
  room_temperature: number;
  humidity: number;
  ac_status: boolean;
  ac_target_temp: number;
  ups_battery: number;
  ups_on_battery: boolean;
  power_consumption: number;
  updated_at: string;
}

export interface Alert {
  id: number;
  title: string;
  message: string;
  level: AlertLevel;
  source?: string;
  is_read: boolean;
  created_at: string;
}

export interface ScheduledTask {
  id: number;
  name: string;
  description?: string;
  task_type: TaskType;
  status: TaskStatus;
  target_server?: string;
  scheduled_time: string;
  executed_at?: string;
  completed_at?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  created_by?: number;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  role?: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
