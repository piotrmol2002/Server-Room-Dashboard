import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const simulatorApi = {
  controlPower: (serverId: number, online: boolean) =>
    api.post(`/api/simulator/servers/${serverId}/power`, { online }),

  setBaseline: (serverId: number, cpu_baseline: number, ram_baseline: number) =>
    api.post(`/api/simulator/servers/${serverId}/baseline`, { cpu_baseline, ram_baseline }),

  triggerStressTest: (serverId: number, duration_seconds: number, intensity: number) =>
    api.post(`/api/simulator/servers/${serverId}/stress-test`, { duration_seconds, intensity }),

  getState: (serverId: number) =>
    api.get(`/api/simulator/servers/${serverId}/state`),
};

export const metricsHistoryApi = {
  getHistory: (serverId: number, hours: number = 1, limit: number = 100) =>
    api.get(`/api/metrics/servers/${serverId}/history`, { params: { hours, limit } }),

  getLatest: (serverId: number) =>
    api.get(`/api/metrics/servers/${serverId}/history/latest`),

  clearHistory: (serverId: number, older_than_hours?: number) =>
    api.delete(`/api/metrics/servers/${serverId}/history`, {
      params: older_than_hours ? { older_than_hours } : undefined
    }),
};
