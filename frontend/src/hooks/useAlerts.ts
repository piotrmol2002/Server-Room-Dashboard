import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../services/api';

export function useAlerts(unreadOnly = false) {
  return useQuery({
    queryKey: ['alerts', unreadOnly],
    queryFn: async () => {
      const response = await alertsApi.getAll(unreadOnly);
      return response.data;
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: false,
    staleTime: 4000,
  });
}
