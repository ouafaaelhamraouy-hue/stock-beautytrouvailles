'use client';

import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { ReactNode } from 'react';

interface CompactKPICardProps {
  label: string;
  value: string | number | ReactNode;
  delta?: {
    value: number;
    isPositive: boolean;
  };
  icon?: ReactNode;
  color?: string;
}

export function CompactKPICard({ label, value, delta, icon, color = '#6366F1' }: CompactKPICardProps) {
  return (
    <Box
      sx={(theme) => ({
        p: 2.5,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.08)' 
          : 'rgba(0, 0, 0, 0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.12)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.2)'
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
      })}
    >
      {/* Label */}
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          mb: 1.5,
        }}
      >
        {label}
      </Typography>

      {/* Value and Icon Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {typeof value === 'string' || typeof value === 'number' ? (
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                fontSize: '1.75rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                fontFeatureSettings: '"tnum"',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }}
            >
              {value}
            </Typography>
          ) : (
            value
          )}
        </Box>
        {icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${color}12`,
              color: color,
              flexShrink: 0,
              ml: 1,
              '& svg': {
                fontSize: '18px',
              },
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      {/* Delta */}
      {delta && (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 'auto',
          }}
        >
          {delta.isPositive ? (
            <TrendingUpIcon sx={{ fontSize: '14px', color: 'success.main' }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: '14px', color: 'error.main' }} />
          )}
          <Typography
            variant="caption"
            sx={{
              color: delta.isPositive ? 'success.main' : 'error.main',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          >
            {delta.isPositive ? '+' : ''}{delta.value}%
          </Typography>
        </Box>
      )}
    </Box>
  );
}
