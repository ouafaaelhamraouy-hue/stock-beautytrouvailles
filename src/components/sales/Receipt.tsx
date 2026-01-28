'use client';

import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { CurrencyDisplay } from '@/components/ui';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';

interface Sale {
  id: string;
  saleDate: string;
  product: {
    id: string;
    sku: string;
    name: string;
    category: {
      name: string;
    };
  };
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  isPromo: boolean;
  createdAt: string;
}

interface ReceiptProps {
  sale: Sale;
  onClose?: () => void;
}

export function Receipt({ sale, onClose }: ReceiptProps) {
  const tSales = useTranslations('sales');

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt - ${sale.product.name}`,
          text: `Receipt for ${sale.product.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You might want to show a toast here
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        maxWidth: 600,
        mx: 'auto',
        '@media print': {
          boxShadow: 'none',
          p: 2,
        },
      }}
    >
      {/* Receipt Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          BeautyTrouvailles
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Stock Management System
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Receipt Details */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              {tSales('saleNumber')}:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {sale.id.slice(-8).toUpperCase()}
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              {tSales('date')}:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {new Date(sale.saleDate).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(sale.saleDate).toLocaleTimeString()}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Item Details */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {tSales('items')}
        </Typography>
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {sale.product.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                SKU: {sale.product.sku} | {sale.product.category.name}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="body2">
              {sale.quantity} × <CurrencyDisplay amount={sale.pricePerUnit} currency="EUR" variant="body2" />
            </Typography>
            <CurrencyDisplay amount={sale.totalAmount} currency="EUR" variant="body1" />
          </Box>
          {sale.isPromo && (
            <Chip
              label="Promotional Sale"
              color="success"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Total */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {tSales('total')}:
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            <CurrencyDisplay amount={sale.totalAmount} currency="EUR" variant="h5" />
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {tSales('thankYou')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Created: {new Date(sale.createdAt).toLocaleString()}
        </Typography>
      </Box>

      {/* Actions */}
      {!onClose && (
        <Box sx={{ display: 'flex', gap: 2, mt: 3, '@media print': { display: 'none' } }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            fullWidth
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShare}
            fullWidth
          >
            Share
          </Button>
        </Box>
      )}
    </Paper>
  );
}
