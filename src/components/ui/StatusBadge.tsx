'use client';

import { Chip } from '@mui/material';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'default';

interface StatusBadgeProps {
  label: string;
  status?: StatusType;
  color?: StatusType;
  size?: 'small' | 'medium';
}

const statusColorMap: Record<string, StatusType> = {
  active: 'success',
  inactive: 'error',
  pending: 'warning',
  completed: 'success',
  cancelled: 'error',
  in_progress: 'info',
  arrived: 'success',
  in_transit: 'info',
  processed: 'success',
};

export function StatusBadge({
  label,
  status,
  color,
  size = 'small',
}: StatusBadgeProps) {
  const badgeColor = color || status || statusColorMap[label.toLowerCase()] || 'default';

  return (
    <Chip
      label={label}
      color={badgeColor}
      size={size}
      sx={{
        textTransform: 'capitalize',
      }}
    />
  );
}
