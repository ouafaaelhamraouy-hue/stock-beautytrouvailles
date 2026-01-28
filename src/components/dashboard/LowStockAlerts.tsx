'use client';

import {
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  Grid,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/routing';

interface LowStockProduct {
  id: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  category?: string;
}

export function LowStockAlerts() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['lowStock'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/low-stock?limit=5');
      if (!response.ok) throw new Error('Failed to fetch low stock alerts');
      const data = await response.json();
      return data.products || [];
    },
  });

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: 4,
          borderRadius: 2,
          backgroundColor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          height: '100%',
        })}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'error.main',
              color: 'white',
            }}
          >
            <WarningIcon sx={{ fontSize: '24px' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} letterSpacing="-0.01em" color="text.primary">
              Stock Bas
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Chargement...
            </Typography>
          </Box>
        </Stack>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Grid item xs={12} key={i}>
              <Box 
                sx={(theme) => ({ 
                  height: 80, 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50', 
                  borderRadius: 2 
                })} 
              />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  const lowStockProducts: LowStockProduct[] = data || [];

  if (lowStockProducts.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: 4,
          borderRadius: 2,
          backgroundColor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          height: '100%',
        })}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'success.main',
              color: 'white',
            }}
          >
            <WarningIcon sx={{ fontSize: '24px' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} letterSpacing="-0.01em" color="text.primary">
              Stock Bas
            </Typography>
            <Typography variant="caption" color="success.main" fontWeight={600}>
              Tous les produits sont en stock
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body2" color="text.secondary">
            Aucune alerte
          </Typography>
        </Box>
      </Paper>
    );
  }

  const outOfStockCount = lowStockProducts.filter(p => p.currentStock === 0).length;

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: 4,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        height: '100%',
      })}
    >
      {/* Header */}
      <Stack 
        direction="row" 
        justifyContent="space-between" 
        alignItems="flex-start" 
        sx={{ mb: 4 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'error.main',
              color: 'white',
              flexShrink: 0,
            }}
          >
            <WarningIcon sx={{ fontSize: '24px' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} letterSpacing="-0.01em" color="text.primary">
              Stock Bas ({lowStockProducts.length})
            </Typography>
            <Typography variant="caption" color="error.main" fontWeight={600} sx={{ display: 'block', mt: 0.5 }}>
              {outOfStockCount > 0 
                ? `${outOfStockCount} produit${outOfStockCount > 1 ? 's' : ''} nécessitent une action urgente`
                : `${lowStockProducts.length} produit${lowStockProducts.length > 1 ? 's' : ''} nécessitent une attention`}
            </Typography>
          </Box>
        </Stack>
        <Button
          size="small"
          onClick={() => router.push('/inventory')}
          endIcon={<ArrowForwardIcon sx={{ fontSize: '16px' }} />}
          sx={{ 
            textTransform: 'none',
            color: 'primary.main',
            fontWeight: 500,
            ml: 2,
            flexShrink: 0,
            '&:hover': {
              backgroundColor: 'rgba(212, 20, 90, 0.08)',
            },
          }}
        >
          Voir tout
        </Button>
      </Stack>

      {/* Product Items - Grid Layout */}
      <Grid container spacing={2}>
        {lowStockProducts.map((product) => {
          const isOutOfStock = product.currentStock === 0;

          return (
            <Grid item xs={12} key={product.id}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              sx={(theme) => ({
                p: 2.5,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'grey.200',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: isOutOfStock ? 'error.main' : 'warning.main',
                  boxShadow: isOutOfStock 
                    ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
                    : '0 0 0 3px rgba(245, 158, 11, 0.1)',
                  bgcolor: isOutOfStock 
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(239, 68, 68, 0.05)'
                    : theme.palette.mode === 'dark'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(245, 158, 11, 0.05)',
                  transform: 'translateX(2px)',
                },
              })}
              >
                <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                  <Typography 
                    variant="body2" 
                    fontWeight={isOutOfStock ? 700 : 600} 
                    color={isOutOfStock ? 'error.main' : 'text.primary'}
                    letterSpacing="-0.01em"
                    sx={{
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.category || 'Uncategorized'}
                  </Typography>
                </Box>

                {/* Status Badge */}
                <Chip
                  label={isOutOfStock ? 'Rupture' : `${product.currentStock} unités`}
                  size="small"
                  sx={{
                    bgcolor: isOutOfStock ? 'error.main' : 'warning.main',
                    color: 'white',
                    fontWeight: 700,
                    height: 32,
                    fontSize: '0.75rem',
                    minWidth: 90,
                    flexShrink: 0,
                  }}
                />
              </Stack>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}
