'use client';

import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface TableHeaderProps {
  left?: ReactNode;
  totalCount?: number;
  selectedCount?: number;
  right?: ReactNode;
}

export function TableHeader({ left, totalCount, selectedCount, right }: TableHeaderProps) {
  const showSelected = typeof selectedCount === 'number';
  const showTotal = typeof totalCount === 'number';

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        alignItems: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {left}
      </Box>
      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
        {showTotal && (
          <Box
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              border: '1px solid',
              borderColor: 'divider',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            Total: {totalCount}
          </Box>
        )}
        {showSelected && (
          <Box
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              border: '1px solid',
              borderColor: selectedCount ? 'primary.main' : 'divider',
              color: selectedCount ? 'primary.main' : 'text.secondary',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            Selected: {selectedCount}
          </Box>
        )}
        {right}
      </Box>
    </Box>
  );
}
