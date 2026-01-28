import { QueryClient } from '@tanstack/react-query';

// Create a singleton QueryClient for better performance
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute default - data is relatively stable
        gcTime: 1000 * 60 * 10, // 10 minutes cache
        refetchOnWindowFocus: false, // Don't refetch when user returns to tab
        refetchOnMount: 'always', // Always refetch on mount for fresh data
        refetchOnReconnect: true, // Refetch on reconnect to get latest data
        retry: 1, // Only retry once on failure
        // Enable structural sharing for better performance
        structuralSharing: true,
        // Use keepPreviousData for paginated lists to prevent UI flicker
        keepPreviousData: true,
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
