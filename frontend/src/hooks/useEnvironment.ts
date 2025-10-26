import { useQuery } from '@tanstack/react-query';
import { environmentApi } from '../services/api';

export function useEnvironment() {
  return useQuery({
    queryKey: ['environment'],
    queryFn: async () => {
      const response = await environmentApi.get();
      return response.data;
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: false,
    staleTime: 14000,
  });
}
