'use client';

import {
  Box,
  Typography,
  Divider,
  Button,
  Chip,
  Stack,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HistoryIcon from '@mui/icons-material/History';
import InventoryIcon from '@mui/icons-material/Inventory';
import { Product } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/format';
import { calculateMargin, calculateNetMargin } from '@/lib/calculations';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';

interface ProductDetailsPanelProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onSell: (product: Product) => void;
  onAddArrivage: (product: Product) => void;
  onViewHistory: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  packagingCost?: number;
}

export function ProductDetailsPanel({
  product,
  open,
  onClose,
  onEdit,
  onSell,
  onAddArrivage,
  onViewHistory,
  onAdjustStock,
  packagingCost = 8.0,
}: ProductDetailsPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const locale = useLocale() as 'en' | 'fr';

  // Handle ESC key to close panel
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!product) {
    // Return empty drawer on mobile, nothing on desktop
    if (isMobile && open) {
      return (
        <Drawer
          anchor="bottom"
          open={false}
          onClose={onClose}
        />
      );
    }
    return null;
  }

  const stockStatus = product.currentStock === 0
    ? { label: 'Out of Stock', color: 'error' as const }
    : product.currentStock <= product.reorderLevel
    ? { label: 'Low Stock', color: 'warning' as const }
    : { label: 'OK', color: 'success' as const };

  const margin = calculateMargin(product.sellingPriceDh, product.purchasePriceMad);
  const netMargin = calculateNetMargin(product.sellingPriceDh, product.purchasePriceMad, packagingCost);

  const PanelContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              fontSize: '1.25rem',
              letterSpacing: '-0.01em',
            }}
          >
            {product.name}
          </Typography>
          <Chip
            label={stockStatus.label}
            color={stockStatus.color}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            flexShrink: 0,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Stack spacing={3}>
          {/* Stock Summary */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1.5,
                color: 'text.secondary',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
              }}
            >
              Stock Summary
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Received
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {product.quantityReceived}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Sold
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {product.quantitySold}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={600}>
                  Current Stock
                </Typography>
                <Chip
                  label={product.currentStock}
                  color={stockStatus.color}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Reorder Level
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {product.reorderLevel}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Category & Brand & Source */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1.5,
                color: 'text.secondary',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
              }}
            >
              Product Info
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {product.category}
                </Typography>
              </Box>
              {product.brand && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Brand
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {product.brand}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Source
                </Typography>
                <Chip
                  label={product.purchaseSource}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Stack>
          </Box>

          {/* Pricing */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1.5,
                color: 'text.secondary',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
              }}
            >
              Pricing
            </Typography>
            <Stack spacing={1.5}>
              {product.purchasePriceEur && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    PA (EUR)
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(product.purchasePriceEur, 'EUR', locale)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  PA (MAD)
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatCurrency(product.purchasePriceMad, 'DH', locale)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  PV (DH)
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(product.sellingPriceDh, 'DH', locale)}
                </Typography>
              </Box>
              {product.promoPriceDh && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Promo (DH)
                  </Typography>
                  <Typography variant="body2" fontWeight={500} color="primary.main">
                    {formatCurrency(product.promoPriceDh, 'DH', locale)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Margins */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1.5,
                color: 'text.secondary',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
              }}
            >
              Margins
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Gross Margin
                </Typography>
                <Chip
                  label={`${margin.toFixed(1)}%`}
                  size="small"
                  color={margin >= 40 ? 'success' : margin >= 30 ? 'warning' : 'error'}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Net Margin
                </Typography>
                <Chip
                  label={`${netMargin.toFixed(1)}%`}
                  size="small"
                  color={netMargin >= 35 ? 'success' : netMargin >= 25 ? 'warning' : 'error'}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Arrivage Info */}
          {product.arrivageReference && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  mb: 1.5,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                }}
              >
                Arrivage
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Reference
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {product.arrivageReference}
                  </Typography>
                </Box>
                {product.exchangeRate && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Exchange Rate
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {product.exchangeRate.toFixed(4)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Footer Actions */}
      <Box
        sx={{
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1.5,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Button
          variant="contained"
          startIcon={<ShoppingCartIcon />}
          onClick={() => onSell(product)}
          fullWidth={isMobile}
          sx={{ flex: 1 }}
        >
          Sell
        </Button>
        <Button
          variant="outlined"
          startIcon={<InventoryIcon />}
          onClick={() => onAdjustStock(product)}
          fullWidth={isMobile}
          sx={{ flex: 1 }}
        >
          Adjust Stock
        </Button>
        <Button
          variant="outlined"
          startIcon={<LocalShippingIcon />}
          onClick={() => onAddArrivage(product)}
          fullWidth={isMobile}
          sx={{ flex: 1 }}
        >
          Add Arrivage
        </Button>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => onEdit(product)}
          fullWidth={isMobile}
          sx={{ flex: 1 }}
        >
          Edit
        </Button>
        <Button
          variant="text"
          startIcon={<HistoryIcon />}
          onClick={() => onViewHistory(product)}
          fullWidth={isMobile}
          sx={{ flex: 1 }}
        >
          History
        </Button>
      </Box>
    </Box>
  );

  // Mobile: Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open && !!product}
        onClose={onClose}
        PaperProps={{
          sx: {
            height: '90vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '90vh',
          },
        }}
      >
        <PanelContent />
      </Drawer>
    );
  }

  // Desktop: Fixed panel (persistent drawer)
  return (
    <Drawer
      anchor="right"
      open={open && !!product}
      onClose={onClose}
      variant="persistent"
      PaperProps={{
        sx: {
          width: 400,
          borderLeft: '1px solid',
          borderColor: 'divider',
          boxShadow: theme.palette.mode === 'dark'
            ? '-4px 0 24px rgba(0, 0, 0, 0.5)'
            : '-4px 0 24px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <PanelContent />
    </Drawer>
  );
}
