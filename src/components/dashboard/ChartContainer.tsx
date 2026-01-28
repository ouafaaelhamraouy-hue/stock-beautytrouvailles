'use client';

import { Box, Typography, Button, ButtonGroup, Paper } from '@mui/material';
import { useState, ReactNode } from 'react';

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  showTimeToggle?: boolean;
  onTimePeriodChange?: (period: '7' | '30' | '90') => void;
}

export function ChartContainer({ 
  title, 
  children, 
  showTimeToggle = true,
  onTimePeriodChange 
}: ChartContainerProps) {
  const [timePeriod, setTimePeriod] = useState<'7' | '30' | '90'>('30');

  const handlePeriodChange = (period: '7' | '30' | '90') => {
    setTimePeriod(period);
    onTimePeriodChange?.(period);
  };

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: 3,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      })}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            fontSize: '1rem',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </Typography>
        {showTimeToggle && (
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => handlePeriodChange('7')}
              variant={timePeriod === '7' ? 'contained' : 'outlined'}
              sx={{
                minWidth: 48,
                fontSize: '0.75rem',
                textTransform: 'none',
                ...(timePeriod === '7' && {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }),
              }}
            >
              7d
            </Button>
            <Button
              onClick={() => handlePeriodChange('30')}
              variant={timePeriod === '30' ? 'contained' : 'outlined'}
              sx={{
                minWidth: 48,
                fontSize: '0.75rem',
                textTransform: 'none',
                ...(timePeriod === '30' && {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }),
              }}
            >
              30d
            </Button>
            <Button
              onClick={() => handlePeriodChange('90')}
              variant={timePeriod === '90' ? 'contained' : 'outlined'}
              sx={{
                minWidth: 48,
                fontSize: '0.75rem',
                textTransform: 'none',
                ...(timePeriod === '90' && {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }),
              }}
            >
              90d
            </Button>
          </ButtonGroup>
        )}
      </Box>

      {/* Chart Content */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Box>
    </Paper>
  );
}
