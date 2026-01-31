'use client';

import { Box, Button, Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type { ReactNode } from 'react';

interface BulkActionBarProps {
  count: number;
  actions?: ReactNode;
  onClear: () => void;
}

export function BulkActionBar({ count, actions, onClear }: BulkActionBarProps) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.default',
        flexWrap: 'wrap',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {count} selected
      </Typography>
      {actions}
      <Button
        size="small"
        variant="text"
        startIcon={<ClearIcon />}
        onClick={onClear}
      >
        Clear selection
      </Button>
    </Box>
  );
}
