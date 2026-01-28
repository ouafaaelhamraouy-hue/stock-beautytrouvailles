'use client';

import { Box, Chip } from '@mui/material';

interface SavedViewsProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'low', label: 'Low Stock' },
  { id: 'out', label: 'Out of Stock' },
  { id: 'promo', label: 'Promo' },
];

export function SavedViews({ activeView, onViewChange }: SavedViewsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.default',
      }}
    >
      {VIEWS.map((view) => (
        <Chip
          key={view.id}
          label={view.label}
          onClick={() => onViewChange(view.id)}
          variant={activeView === view.id ? 'filled' : 'outlined'}
          color={activeView === view.id ? 'primary' : 'default'}
          size="small"
          sx={{
            fontWeight: activeView === view.id ? 600 : 500,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: activeView === view.id ? 'primary.main' : 'action.hover',
            },
          }}
        />
      ))}
    </Box>
  );
}
