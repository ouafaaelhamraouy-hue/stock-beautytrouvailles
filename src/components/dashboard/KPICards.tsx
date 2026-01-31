'use client';

import { memo } from 'react';
import { Grid, Box, Typography, Paper } from '@mui/material';
import { StatsCard } from '@/components/ui';
import InventoryIcon from '@mui/icons-material/Inventory';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useQuery } from '@tanstack/react-query';

// Optimized: Use stats API instead of fetching all products
export const KPICards = memo(function KPICards() {
  // Fetch dashboard stats (includes all KPIs calculated server-side)
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - stats don't change that often
  });

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={(theme) => ({
          border: '1px solid',
          borderColor: theme.palette.divider,
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'background.paper',
        })}
      >
        <Grid container spacing={0}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Box
                sx={(theme) => ({
                  p: 4,
                  borderRight: i % 3 !== 0 ? `1px solid ${theme.palette.divider}` : 'none',
                  borderBottom: i <= 6 ? `1px solid ${theme.palette.divider}` : 'none',
                })}
              >
                <Box 
                  sx={(theme) => ({ 
                    height: 140, 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50', 
                    borderRadius: 1 
                  })} 
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  // Layout: 3 columns x 3 rows (7 cards total)
  // First 6 cards have bottom borders, last row (7th card) has no bottom border

  return (
      <Paper
        elevation={0}
        sx={(theme) => ({
          border: '1px solid',
          borderColor: theme.palette.divider,
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'background.paper',
        })}
      >
      <Grid 
        container 
        spacing={0}
        sx={(theme) => ({
            '& > .MuiGrid-item': {
              // 3 columns on desktop - balanced layout
              borderRight: {
                xs: 'none',
                sm: `1px solid ${theme.palette.divider}`,
                md: `1px solid ${theme.palette.divider}`,
              },
              // Remove right border on 3rd column (every 3rd item)
              '&:nth-of-type(3n)': {
                borderRight: { sm: 'none', md: 'none' },
              },
              // Bottom border for first 6 items (2 rows)
              '&:nth-of-type(-n+6)': {
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
            },
        })}
      >
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="📦 Produits"
            value={statsData?.totalProducts || 0}
            subtitle="en stock"
            icon={<InventoryIcon />}
            color="#E91E63"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="💰 Valeur achat"
            value={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: 'text.primary',
                    fontSize: { xs: '2rem', sm: '2.25rem', md: '2.5rem' },
                    letterSpacing: '-0.03em',
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {(statsData?.inventoryValue || 0).toLocaleString('fr-FR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                    color: 'text.secondary',
                    ml: 0.5,
                  }}
                >
                  MAD
                </Typography>
              </Box>
            }
            subtitle="en stock"
            icon={<CurrencyExchangeIcon />}
            color="#EC407A"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="📈 Marge Brute"
            value={`${((statsData?.averageMargin || 0)).toFixed(1)}%`}
            subtitle="sans emballage"
            icon={<TrendingUpIcon />}
            color={(statsData?.averageMargin || 0) >= 40 ? '#4CAF50' : (statsData?.averageMargin || 0) >= 30 ? '#FF9800' : '#F44336'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="💸 Marge Nette"
            value={`${((statsData?.averageNetMargin || 0)).toFixed(1)}%`}
            subtitle={`après emballage (${(statsData?.packagingCost || 8).toFixed(2)} DH)`}
            icon={<TrendingUpIcon />}
            color={(statsData?.averageNetMargin || 0) >= 35 ? '#9C27B0' : (statsData?.averageNetMargin || 0) >= 25 ? '#FF9800' : '#F44336'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="⚠️ Alertes"
            value={statsData?.lowStockCount || 0}
            subtitle="stock bas"
            icon={<WarningIcon />}
            color={(statsData?.lowStockCount || 0) > 0 ? '#F44336' : '#4CAF50'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="🛒 Ventes"
            value={statsData?.salesThisMonth || 0}
            subtitle="ce mois"
            icon={<ShoppingCartIcon />}
            color="#9C27B0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="🚚 Arrivages"
            value={statsData?.totalShipments || 0}
            subtitle="total"
            icon={<LocalShippingIcon />}
            color="#2196F3"
          />
        </Grid>
      </Grid>
    </Paper>
  );
});
