'use client';

import { Box, Typography, Paper, List, ListItem, ListItemButton, ListItemText, Divider } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/routing';
import { formatRelativeTime } from '@/lib/format';

export function RecentActivity() {
  const router = useRouter();

  // Use data from aggregated dashboard summary (shared cache)
  const { data: summaryData } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/summary');
      if (!response.ok) throw new Error('Failed to fetch dashboard summary');
      return response.json();
    },
    staleTime: 1000 * 60, // 60 seconds
    gcTime: 1000 * 60 * 5,
  });

  // Fetch recent arrivages and expenses separately (less critical, can be lazy-loaded)
  const { data: recentArrivages } = useQuery({
    queryKey: ['recentArrivages'],
    queryFn: async () => {
      const response = await fetch('/api/shipments?limit=5&sort=createdAt');
      if (!response.ok) return [];
      const data = await response.json();
      return data.shipments || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - less frequently updated
  });

  const { data: recentExpenses } = useQuery({
    queryKey: ['recentExpenses'],
    queryFn: async () => {
      const response = await fetch('/api/expenses?limit=5&sort=date');
      if (!response.ok) return [];
      const data = await response.json();
      return data.expenses || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  type DecimalLike = { toNumber: () => number };
  type RecentSale = {
    id: string;
    product?: { name?: string };
    quantity: number;
    totalAmount: number | DecimalLike;
    saleDate?: string;
    createdAt?: string;
  };
  type RecentArrivage = {
    id: string;
    reference?: string;
    productCount?: number;
    totalCostDh?: number | DecimalLike;
    receivedDate?: string;
    createdAt?: string;
  };
  type RecentExpense = {
    id: string;
    description?: string;
    amountDH?: number | DecimalLike;
    date?: string;
    createdAt?: string;
  };

  const recentSales = (summaryData?.recentSales || []) as RecentSale[];

  // Helper function to safely convert Decimal to number
  const toNumber = (value: unknown): number => {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    // Handle Prisma Decimal type
    if (typeof value === 'object' && 'toNumber' in value) {
      return (value as DecimalLike).toNumber();
    }
    return 0;
  };

  // Combine and sort all activities
  const activities = [
    ...recentSales.map((sale) => ({
      id: sale.id,
      type: 'sale' as const,
      title: sale.product?.name || 'Sale',
      subtitle: `${sale.quantity} units • ${toNumber(sale.totalAmount).toFixed(2)} MAD`,
      date: sale.saleDate || sale.createdAt,
      icon: ShoppingCartIcon,
      color: 'success.main',
      onClick: () => router.push(`/sales/${sale.id}`),
    })),
    ...((recentArrivages || []) as RecentArrivage[]).map((arrivage) => ({
      id: arrivage.id,
      type: 'arrivage' as const,
      title: arrivage.reference || 'Arrivage',
      subtitle: `${arrivage.productCount || 0} products • ${toNumber(arrivage.totalCostDh).toFixed(2)} MAD`,
      date: arrivage.receivedDate || arrivage.createdAt,
      icon: LocalShippingIcon,
      color: 'info.main',
      onClick: () => router.push(`/shipments/${arrivage.id}`),
    })),
    ...((recentExpenses || []) as RecentExpense[]).map((expense) => ({
      id: expense.id,
      type: 'expense' as const,
      title: expense.description || 'Expense',
      subtitle: `${toNumber(expense.amountDH).toFixed(2)} MAD`,
      date: expense.date || expense.createdAt,
      icon: ReceiptIcon,
      color: 'warning.main',
      onClick: () => router.push(`/expenses`),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

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
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          fontSize: '1rem',
          letterSpacing: '-0.01em',
          mb: 3,
        }}
      >
        Recent Activity
      </Typography>

      <List sx={{ p: 0, flex: 1, overflow: 'auto' }}>
        {activities.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No recent activity
            </Typography>
          </Box>
        ) : (
          activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <Box key={activity.id || index}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={activity.onClick}
                    sx={{
                      px: 0,
                      py: 1.5,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${activity.color}15`,
                      color: activity.color,
                      mr: 2,
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </Box>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={500}>
                        {activity.title}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        component="div"
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{activity.subtitle}</span>
                          <span style={{ marginLeft: 'auto' }}>
                            {formatRelativeTime(activity.date, 'en')}
                          </span>
                        </Box>
                      </Typography>
                    }
                  />
                  </ListItemButton>
                </ListItem>
                {index < activities.length - 1 && <Divider sx={{ ml: 7 }} />}
              </Box>
            );
          })
        )}
      </List>
    </Paper>
  );
}
