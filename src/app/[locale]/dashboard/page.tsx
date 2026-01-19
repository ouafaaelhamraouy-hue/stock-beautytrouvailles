'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid,
  Button,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { StatsCard } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import { RecentSalesTable } from '@/components/dashboard/RecentSalesTable';
import { TopProductsTable } from '@/components/dashboard/TopProductsTable';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { useRouter } from '@/i18n/routing';

interface DashboardStats {
  totalProducts: number;
  totalShipments: number;
  totalSales: number;
  totalInventory: number;
  totalRevenue: number;
  totalExpenses: number;
  totalCosts: number;
  totalProfit: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

interface ProfitByShipment {
  shipmentId: string;
  reference: string;
  supplier: string;
  status: string;
  arrivalDate?: string | null;
  totalCostEUR: number;
  totalCostDH: number;
  totalRevenueEUR: number;
  totalRevenueDH: number;
  profitEUR: number;
  profitDH: number;
  marginPercent: number;
  itemsCount: number;
  totalQuantitySold: number;
}

export default function DashboardPage() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [profitByShipment, setProfitByShipment] = useState<ProfitByShipment[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [statsRes, revenueRes, profitRes, recentSalesRes, topProductsRes, lowStockRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/revenue'),
        fetch('/api/dashboard/profit-by-shipment'),
        fetch('/api/dashboard/recent-sales'),
        fetch('/api/dashboard/top-products'),
        fetch('/api/dashboard/low-stock'),
      ]);

      if (!statsRes.ok || !revenueRes.ok || !profitRes.ok || !recentSalesRes.ok || !topProductsRes.ok || !lowStockRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [statsData, revenueData, profitData, recentSalesData, topProductsData, lowStockData] = await Promise.all([
        statsRes.json(),
        revenueRes.json(),
        profitRes.json(),
        recentSalesRes.json(),
        topProductsRes.json(),
        lowStockRes.json(),
      ]);

      setStats(statsData);
      setRevenueData(revenueData);
      setProfitByShipment(profitData);
      setRecentSales(recentSalesData);
      setTopProducts(topProductsData);
      setLowStockAlerts(lowStockData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchDashboardData();
    }
  }, [mounted]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (!mounted || loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('dashboard')}
          </Typography>
          <LoadingState variant="card" rows={3} />
        </Box>
      </Container>
    );
  }

  if (error && !stats) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('dashboard')}
          </Typography>
          <ErrorState message={error} onRetry={fetchDashboardData} />
        </Box>
      </Container>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('dashboard')}
          </Typography>
          <Button onClick={handleRefresh} variant="outlined" size="small">
            Refresh
          </Button>
        </Box>
        
        {user && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Welcome back, {user.email}
              {profile && profile.role === 'ADMIN' && (
                <Typography component="span" variant="body2" sx={{ ml: 1, color: 'primary.main', fontWeight: 'bold' }}>
                  (Admin)
                </Typography>
              )}
            </Typography>
          </Box>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={t('products')}
              value={stats.totalProducts}
              icon={<InventoryIcon sx={{ fontSize: 40 }} />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={t('shipments')}
              value={stats.totalShipments}
              icon={<ShoppingCartIcon sx={{ fontSize: 40 }} />}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={t('sales')}
              value={stats.totalSales}
              icon={<AttachMoneyIcon sx={{ fontSize: 40 }} />}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={t('inventory')}
              value={stats.totalInventory}
              icon={<DashboardIcon sx={{ fontSize: 40 }} />}
              color="#9c27b0"
            />
          </Grid>
        </Grid>

        {/* Financial Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Revenue"
              value={<CurrencyDisplay amount={stats.totalRevenue} currency="EUR" variant="h4" />}
              icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Costs"
              value={<CurrencyDisplay amount={stats.totalCosts} currency="EUR" variant="h4" />}
              icon={<ReceiptIcon sx={{ fontSize: 40 }} />}
              color="#d32f2f"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Expenses"
              value={<CurrencyDisplay amount={stats.totalExpenses} currency="EUR" variant="h4" />}
              icon={<TrendingDownIcon sx={{ fontSize: 40 }} />}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Profit"
              value={
                <Box>
                  <CurrencyDisplay 
                    amount={stats.totalProfit} 
                    currency="EUR" 
                    variant="h4"
                    color={stats.totalProfit >= 0 ? undefined : 'error.main'}
                  />
                  {stats.totalRevenue > 0 && (
                    <Typography variant="caption" color={stats.totalProfit >= 0 ? 'success.main' : 'error.main'} sx={{ mt: 0.5, display: 'block' }}>
                      ({((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)}% margin)
                    </Typography>
                  )}
                </Box>
              }
              icon={stats.totalProfit >= 0 ? <TrendingUpIcon sx={{ fontSize: 40 }} /> : <TrendingDownIcon sx={{ fontSize: 40 }} />}
              color={stats.totalProfit >= 0 ? '#2e7d32' : '#d32f2f'}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Monthly Revenue Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Monthly Revenue (Last 6 Months)
              </Typography>
              {revenueData.length > 0 ? (
                <Box sx={{ width: '100%', height: 300 }}>
                  <LineChart
                    xAxis={[
                      {
                        data: revenueData.map((_, index) => index),
                        valueFormatter: (value) => revenueData[value]?.month || '',
                      },
                    ]}
                    series={[
                      {
                        data: revenueData.map((d) => d.revenue),
                        label: 'Revenue (EUR)',
                        color: '#1976d2',
                      },
                    ]}
                    width={undefined}
                    height={300}
                    sx={{ width: '100%' }}
                  />
                </Box>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No revenue data available
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Profit by Shipment Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Profit by Shipment (Top 10)
              </Typography>
              {profitByShipment.length > 0 ? (
                <Box sx={{ width: '100%', height: 300 }}>
                  <BarChart
                    xAxis={[
                      {
                        data: profitByShipment.slice(0, 10).map((s) => s.reference),
                        scaleType: 'band',
                      },
                    ]}
                    series={[
                      {
                        data: profitByShipment.slice(0, 10).map((s) => s.profitEUR),
                        label: 'Profit (EUR)',
                        color: profitByShipment[0]?.profitEUR >= 0 ? '#2e7d32' : '#d32f2f',
                      },
                    ]}
                    width={undefined}
                    height={300}
                    sx={{ width: '100%' }}
                  />
                </Box>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No shipment data available
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Recent Sales */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Sales
                </Typography>
                <Button size="small" onClick={() => router.push('/sales')}>
                  View All
                </Button>
              </Box>
              <RecentSalesTable sales={recentSales} />
            </Paper>
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Top Products by Revenue
                </Typography>
                <Button size="small" onClick={() => router.push('/products')}>
                  View All
                </Button>
              </Box>
              <TopProductsTable products={topProducts} />
            </Paper>
          </Grid>
        </Grid>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <LowStockAlerts alerts={lowStockAlerts} />
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
}
