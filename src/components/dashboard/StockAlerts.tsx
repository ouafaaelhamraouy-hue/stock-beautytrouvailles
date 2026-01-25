'use client';

import { Paper, Typography, Box, List, ListItem, ListItemText, Chip, Alert } from '@mui/material';
import { useProducts, Product } from '@/hooks/useProducts';
import { useMemo } from 'react';
import WarningIcon from '@mui/icons-material/Warning';
import InventoryIcon from '@mui/icons-material/Inventory';

export function StockAlerts() {
  const { data, isLoading } = useProducts({ limit: 1000 });

  const alerts = useMemo(() => {
    if (!data?.products) return [];

    return data.products
      .filter((p: Product) => p.currentStock <= p.reorderLevel || p.currentStock === 0)
      .sort((a: Product, b: Product) => a.currentStock - b.currentStock)
      .slice(0, 10); // Top 10
  }, [data]);

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          ⚠️ Stock bas
        </Typography>
        <Box>Loading...</Box>
      </Paper>
    );
  }

  if (alerts.length === 0) {
    return (
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F8 100%)',
          border: '1px solid rgba(233, 30, 99, 0.12)',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon />
          Stock bas
        </Typography>
        <Alert severity="success" sx={{ mt: 2 }}>
          Tous les produits sont en stock suffisant
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F8 100%)',
        border: '1px solid rgba(233, 30, 99, 0.12)',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="error" />
        Stock bas ({alerts.length})
      </Typography>
      <List dense>
        {alerts.map((product: Product) => (
          <ListItem
            key={product.id}
            sx={{
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <ListItemText
              primary={product.name}
              secondary={`${product.brand || 'N/A'} - ${product.category}`}
            />
            <Chip
              label={product.currentStock === 0 ? 'Rupture' : `${product.currentStock} restants`}
              color={product.currentStock === 0 ? 'error' : 'warning'}
              size="small"
              sx={{ ml: 2 }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
