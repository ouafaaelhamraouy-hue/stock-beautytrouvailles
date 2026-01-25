import { Skeleton, Box } from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton
              key={j}
              variant="rectangular"
              height={52}
              sx={{ flex: 1 }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}
