'use client';

import { Box, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface SavedViewsProps {
  activeView: string;
  onViewChange: (view: string) => void;
  counts: {
    total: number;
    low: number;
    out: number;
    promo: number;
  };
}

const VIEWS = [
  { id: 'all', label: 'All', countKey: 'total' },
  { id: 'low', label: 'Low Stock', countKey: 'low' },
  { id: 'out', label: 'Out of Stock', countKey: 'out' },
  { id: 'promo', label: 'Promo', countKey: 'promo' },
] as const;

export function SavedViews({ activeView, onViewChange, counts }: SavedViewsProps) {
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        gap: 1,
        px: 2,
        py: 1.25,
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(0, 0, 0, 0.08)',
        backgroundColor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.55)
          : alpha(theme.palette.common.white, 0.65),
        flexWrap: 'wrap',
      })}
    >
      {VIEWS.map((view) => (
        <Chip
          key={view.id}
          label={`${view.label} · ${counts[view.countKey]}`}
          onClick={() => onViewChange(view.id)}
          variant="outlined"
          color={activeView === view.id ? 'primary' : 'default'}
          size="small"
          sx={(theme) => ({
            fontWeight: activeView === view.id ? 700 : 500,
            cursor: 'pointer',
            borderColor: activeView === view.id
              ? alpha(theme.palette.primary.main, 0.6)
              : alpha(theme.palette.text.primary, 0.12),
            backgroundColor: activeView === view.id
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.common.white, 0.4),
            '&:hover': {
              backgroundColor: activeView === view.id
                ? alpha(theme.palette.primary.main, 0.18)
                : alpha(theme.palette.common.white, 0.6),
            },
          })}
        />
      ))}
    </Box>
  );
}
