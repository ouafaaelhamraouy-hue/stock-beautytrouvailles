'use client';

import { Box, Typography, Stack } from '@mui/material';
import { ReactNode } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatsCardProps {
  title: string;
  value: string | number | ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, subtitle, icon, color = '#D4145A', trend }: StatsCardProps) {
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        p: 4,
        position: 'relative',
        transition: 'all 0.2s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '60%',
          background: `linear-gradient(180deg, ${color} 0%, ${color}DD 100%)`,
          borderRadius: '0 2px 2px 0',
        },
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.02)',
        },
      })}
    >
      {/* Header with Icon */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        {icon && (
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${color}12`,
              border: `1.5px solid ${color}20`,
              flexShrink: 0,
              '& svg': {
                fontSize: '26px',
                color: color,
              },
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.6875rem',
              letterSpacing: '0.1em',
              mb: 0.5,
              display: 'block',
            }}
          >
            {title.replace(/[📦💰📈⚠️🛒🚚]/g, '').trim()}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
                fontWeight: 400,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {trend && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: trend.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              flexShrink: 0,
            }}
          >
            {trend.isPositive ? (
              <TrendingUpIcon sx={{ fontSize: '14px', color: 'success.main' }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: '14px', color: 'error.main' }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend.isPositive ? 'success.main' : 'error.main',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              {Math.abs(trend.value)}%
            </Typography>
          </Box>
        )}
      </Stack>

      {/* Value */}
      <Box>
        {typeof value === 'string' || typeof value === 'number' ? (
          <Typography
            variant="h2"
            component="div"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              color: 'text.primary',
              fontSize: { xs: '2rem', sm: '2.25rem', md: '2.5rem' },
              letterSpacing: '-0.03em',
              fontFeatureSettings: '"tnum"',
            }}
          >
            {value}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Box>
  );
}
