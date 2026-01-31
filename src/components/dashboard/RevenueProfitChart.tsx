'use client';

import { Box, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { useQuery } from '@tanstack/react-query';
import { formatNumber } from '@/lib/format';

type TrendPoint = {
  date: string;
  revenue: number;
  profit: number;
};

interface RevenueProfitChartProps {
  period: '7' | '30' | '90';
  locale: 'en' | 'fr';
}

export function RevenueProfitChart({ period, locale }: RevenueProfitChartProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['revenueProfitTrend', period],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/revenue-profit?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch revenue trend');
      }
      return response.json() as Promise<TrendPoint[]>;
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

  const labels = data.map((point) => {
    const date = new Date(point.date);
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  });

  const revenueSeries = data.map((point) => point.revenue);
  const profitSeries = data.map((point) => point.profit);

  return (
    <LineChart
      height={300}
      xAxis={[
        {
          scaleType: 'point',
          data: labels,
        },
      ]}
      series={[
        {
          label: 'Revenue',
          data: revenueSeries,
          color: '#6366F1',
          valueFormatter: (value) => `${formatNumber(Number(value || 0), locale)} MAD`,
        },
        {
          label: 'Profit',
          data: profitSeries,
          color: '#10B981',
          valueFormatter: (value) => `${formatNumber(Number(value || 0), locale)} MAD`,
        },
      ]}
      margin={{ left: 60, right: 24, top: 12, bottom: 40 }}
      grid={{ horizontal: true }}
      slotProps={{
        legend: {
          direction: 'row',
          position: { vertical: 'top', horizontal: 'right' },
          padding: 0,
        },
      }}
    />
  );
}
