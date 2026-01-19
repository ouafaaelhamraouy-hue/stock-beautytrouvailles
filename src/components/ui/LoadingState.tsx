'use client';

import { Box, Skeleton, Stack } from '@mui/material';

interface LoadingStateProps {
  variant?: 'table' | 'card' | 'list' | 'dashboard';
  rows?: number;
}

export function LoadingState({ variant = 'card', rows = 3 }: LoadingStateProps) {
  if (variant === 'table') {
    return (
      <Box sx={{ width: '100%' }}>
        <Stack spacing={1}>
          <Skeleton variant="rectangular" height={60} />
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={50} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (variant === 'dashboard') {
    return (
      <Box sx={{ width: '100%' }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={120} />
            ))}
          </Box>
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      </Box>
    );
  }

  if (variant === 'list') {
    return (
      <Box sx={{ width: '100%' }}>
        <Stack spacing={1}>
          {Array.from({ length: rows }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    );
  }

  // Default: card variant
  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={2}>
        <Skeleton variant="rectangular" height={200} />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </Stack>
    </Box>
  );
}
