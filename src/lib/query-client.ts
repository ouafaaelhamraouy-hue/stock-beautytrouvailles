import { QueryClient } from '@tanstack/react-query';

// Create a singleton QueryClient for better performance
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes - don't refetch if data is fresh
        gcTime: 1000 * 60 * 30, // 30 minutes cache (formerly cacheTime)
        refetchOnWindowFocus: false, // Don't refetch when user returns to tab
        refetchOnMount: false, // Don't refetch when component mounts if data exists
        refetchOnReconnect: false, // Don't refetch on reconnect
        retry: 1, // Only retry once on failure
        // Enable structural sharing for better performance
        structuralSharing: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });

// Use a global singleton in server-side rendering to avoid recreating clients
const globalForQueryClient = globalThis as unknown as {
  queryClient: ReturnType<typeof createQueryClient> | undefined;
};

export const queryClient =
  globalForQueryClient.queryClient ?? createQueryClient();

if (typeof window === 'undefined') {
  globalForQueryClient.queryClient = queryClient;
}
