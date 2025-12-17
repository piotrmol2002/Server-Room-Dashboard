import { useQuery } from '@tanstack/react-query';
import { environmentApi } from '../services/api';

interface UseEnvironmentOptions {
  refetchInterval?: number | false;
}

export function useEnvironment(options: UseEnvironmentOptions = {}) {
  const { refetchInterval = 15000 } = options;

  return useQuery({
    queryKey: ['environment'],
    queryFn: async () => {
      const response = await environmentApi.get();
      return response.data;
    },
    refetchInterval,
    refetchOnWindowFocus: false,
    staleTime: 14000,
  });
}
