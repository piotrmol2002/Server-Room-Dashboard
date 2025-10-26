import { useQuery } from '@tanstack/react-query';
import { serversApi } from '../services/api';

export function useServers() {
  return useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await serversApi.getAll();
      return response.data;
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: false,
    staleTime: 4000,
  });
}
