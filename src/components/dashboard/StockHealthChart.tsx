'use client';

import { Box, Typography } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { useQuery } from '@tanstack/react-query';

type StockHealthResponse = {
  healthy: number;
  low: number;
  out: number;
  total: number;
};

export function StockHealthChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stockHealth'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stock-health');
      if (!response.ok) {
        throw new Error('Failed to fetch stock health');
      }
      return response.json() as Promise<StockHealthResponse>;
    },
    staleTime: 1000 * 60,
  });

  if (isLoading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">Loading chart...</Typography>
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">Unable to load chart</Typography>
      </Box>
    );
  }

  if (data.total === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">No stock data yet</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <PieChart
        height={300}
        series={[
          {
            innerRadius: 60,
            outerRadius: 110,
            paddingAngle: 2,
            cornerRadius: 6,
            data: [
              { id: 0, value: data.healthy, label: 'Healthy', color: '#10B981' },
              { id: 1, value: data.low, label: 'Low', color: '#F59E0B' },
              { id: 2, value: data.out, label: 'Out', color: '#EF4444' },
            ],
          },
        ]}
        slotProps={{
          legend: {
            direction: 'row',
            position: { vertical: 'bottom', horizontal: 'middle' },
            padding: 0,
          },
        }}
      />
    </Box>
  );
}
