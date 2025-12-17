export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  TECHNICIAN = 'technician',
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
  OVERDUE = 'overdue',
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
  target_role?: UserRole;
  is_read: boolean;
  read_at?: string;
  read_by_email?: string;
  created_at: string;
}

export interface AlertLog {
  id: number;
  title: string;
  message: string;
  level: AlertLevel;
  source?: string;
  target_role?: UserRole;
  is_read: boolean;
  read_at?: string;
  read_by_email?: string;
  created_at: string;
  deleted_at?: string;
  deleted_by_email?: string;
}

export interface AlertThreshold {
  id: number;
  cpu_warning_threshold: number;
  cpu_critical_threshold: number;
  temperature_warning_threshold: number;
  temperature_critical_threshold: number;
  ram_warning_threshold: number;
  ram_critical_threshold: number;
  humidity_warning_threshold: number;
  humidity_critical_threshold: number;
  updated_by?: string;
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
  recurrence_days?: number;
  assigned_role?: UserRole;
  created_by?: number;
  completed_by_email?: string;
  completion_comment?: string;
  created_at: string;
}

export interface TaskCompletionHistory {
  id: number;
  task_id: number;
  completed_at: string;
  completed_by_email: string;
  completion_comment?: string;
  scheduled_date: string;
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
