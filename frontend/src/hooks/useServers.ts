import { useQuery } from '@tanstack/react-query';
import { serversApi } from '../services/api';

interface UseServersOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useServers(options: UseServersOptions = {}) {
  const { enabled = true, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await serversApi.getAll();
      return response.data;
    },
    enabled,
    refetchInterval,
    refetchOnWindowFocus: false,
    staleTime: 25000,
  });
}
