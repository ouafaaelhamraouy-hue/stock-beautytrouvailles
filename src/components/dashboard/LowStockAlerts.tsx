'use client';

import {
  Box,
  Paper,
  Typography,
  Chip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { StatusBadge } from '@/components/ui';
import WarningIcon from '@mui/icons-material/Warning';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: {
    name: string;
  };
}

interface LowStockAlert {
  product: Product;
  totalQuantity: number;
  totalRemaining: number;
  totalSold: number;
  stockPercentage: number;
  status: 'low_stock' | 'out_of_stock';
  shipments: Array<{ reference: string; supplier: string; remaining: number }>;
}

interface LowStockAlertsProps {
  alerts: LowStockAlert[];
}

export function LowStockAlerts({ alerts }: LowStockAlertsProps) {
  const t = useTranslations('inventory');
  const router = useRouter();

  if (alerts.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Low Stock Alerts
        </Typography>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            All products have sufficient stock
          </Typography>
        </Box>
      </Paper>
    );
  }

  const outOfStock = alerts.filter((a) => a.status === 'out_of_stock');
  const lowStock = alerts.filter((a) => a.status === 'low_stock');

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <WarningIcon color="warning" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Low Stock Alerts ({alerts.length})
        </Typography>
      </Box>

      {outOfStock.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Out of Stock ({outOfStock.length})</AlertTitle>
          <List dense>
            {outOfStock.slice(0, 5).map((alert) => (
              <ListItem
                key={alert.product.id}
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
                onClick={() => router.push(`/inventory?productId=${alert.product.id}`)}
              >
                <ListItemText
                  primary={`${alert.product.sku} - ${alert.product.name}`}
                  secondary={`Remaining: ${alert.totalRemaining}`}
                />
                <StatusBadge label={t('outOfStock')} status="error" />
              </ListItem>
            ))}
          </List>
          {outOfStock.length > 5 && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              + {outOfStock.length - 5} more out of stock items
            </Typography>
          )}
        </Alert>
      )}

      {lowStock.length > 0 && (
        <Alert severity="warning">
          <AlertTitle>Low Stock ({lowStock.length})</AlertTitle>
          <List dense>
            {lowStock.slice(0, 5).map((alert) => (
              <ListItem
                key={alert.product.id}
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
                onClick={() => router.push(`/inventory?productId=${alert.product.id}`)}
              >
                <ListItemText
                  primary={`${alert.product.sku} - ${alert.product.name}`}
                  secondary={`Remaining: ${alert.totalRemaining} (${alert.stockPercentage.toFixed(1)}%)`}
                />
                <StatusBadge label={t('lowStock')} status="warning" />
              </ListItem>
            ))}
          </List>
          {lowStock.length > 5 && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              + {lowStock.length - 5} more low stock items
            </Typography>
          )}
        </Alert>
      )}
    </Paper>
  );
}
