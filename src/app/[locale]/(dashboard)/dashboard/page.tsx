'use client';

import { Box, Typography, Grid } from '@mui/material';
import { CompactKPICard } from '@/components/dashboard/CompactKPICard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { ActionCenter } from '@/components/dashboard/ActionCenter';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { RevenueProfitChart } from '@/components/dashboard/RevenueProfitChart';
import { StockHealthChart } from '@/components/dashboard/StockHealthChart';
import { useQuery } from '@tanstack/react-query';
import InventoryIcon from '@mui/icons-material/Inventory';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { formatNumber } from '@/lib/format';
import { useLocale } from 'next-intl';
import { Suspense, useState } from 'react';

export default function DashboardPage() {
  const locale = useLocale() as 'en' | 'fr';
  const [trendPeriod, setTrendPeriod] = useState<'7' | '30' | '90'>('30');

  // Fetch aggregated dashboard summary (single request)
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/summary');
      if (!response.ok) throw new Error('Failed to fetch dashboard summary');
      return response.json();
    },
    staleTime: 1000 * 60, // 60 seconds - data is relatively stable
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });

  const stats = summaryData?.stats || {};

  return (
    <Box
      sx={{
        maxWidth: '1600px',
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            letterSpacing: '-0.02em',
            mb: 0.5,
            fontSize: { xs: '1.75rem', sm: '2rem' },
          }}
        >
          Dashboard
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: '0.875rem' }}
        >
          Overview of your stock and performance
        </Typography>
      </Box>

      {/* Compact KPI Cards Row - Max 5 */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <CompactKPICard
            label="Total Products"
            value={stats.totalProducts || 0}
            icon={<InventoryIcon />}
            color="#6366F1"
            delta={isLoading ? undefined : { value: 0, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <CompactKPICard
            label="Inventory Cost"
            value={
              <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.75rem',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {formatNumber(stats.inventoryValue || 0, locale)}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: 'text.secondary',
                  }}
                >
                  MAD
                </Typography>
              </Typography>
            }
            icon={<CurrencyExchangeIcon />}
            color="#10B981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <CompactKPICard
            label="Net Margin"
            value={`${(stats.averageNetMargin || 0).toFixed(1)}%`}
            icon={<TrendingUpIcon />}
            color={(stats.averageNetMargin || 0) >= 35 ? '#10B981' : (stats.averageNetMargin || 0) >= 25 ? '#F59E0B' : '#EF4444'}
            delta={isLoading ? undefined : { value: 0, isPositive: (stats.averageNetMargin || 0) >= 30 }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <CompactKPICard
            label="Low Stock Alerts"
            value={stats.lowStockCount || 0}
            icon={<WarningIcon />}
            color={(stats.lowStockCount || 0) > 0 ? '#EF4444' : '#10B981'}
            delta={isLoading ? undefined : { value: 0, isPositive: (stats.lowStockCount || 0) === 0 }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <CompactKPICard
            label="Sales This Month"
            value={stats.salesThisMonth || 0}
            icon={<ShoppingCartIcon />}
            color="#8B5CF6"
            delta={isLoading ? undefined : { value: 0, isPositive: true }}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column - Charts */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Revenue vs Profit Trend */}
            <Grid item xs={12}>
              <ChartContainer
                title="Revenue vs Profit"
                showTimeToggle={true}
                onTimePeriodChange={(period) => {
                  setTrendPeriod(period);
                }}
              >
                <Suspense
                  fallback={
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
                  }
                >
                  <RevenueProfitChart period={trendPeriod} locale={locale} />
                </Suspense>
              </ChartContainer>
            </Grid>

            {/* Stock Health Chart */}
            <Grid item xs={12}>
              <ChartContainer
                title="Stock Health"
                showTimeToggle={false}
              >
                <Suspense
                  fallback={
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
                  }
                >
                  <StockHealthChart />
                </Suspense>
              </ChartContainer>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column - Action Center and Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Action Center */}
            <Grid item xs={12}>
              <Box sx={{ height: 500 }}>
                <ActionCenter />
              </Box>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12}>
              <Box sx={{ height: 400 }}>
                <RecentActivity />
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
