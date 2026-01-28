'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { CurrencyDisplay } from '@/components/ui';

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
}

interface RecentSalesTableProps {
  sales: Sale[];
}

export function RecentSalesTable({ sales }: RecentSalesTableProps) {
  const t = useTranslations('sales');
  const router = useRouter();

  if (sales.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No recent sales
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>{t('saleDate')}</strong></TableCell>
            <TableCell><strong>{t('product')}</strong></TableCell>
            <TableCell align="right"><strong>{t('quantity')}</strong></TableCell>
            <TableCell align="right"><strong>{t('totalAmount')}</strong></TableCell>
            <TableCell align="center"><strong>Promo</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sales.map((sale) => (
            <TableRow
              key={sale.id}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => router.push(`/sales/${sale.id}`)}
            >
              <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <Box>
                  <Box sx={{ fontWeight: 500 }}>{sale.product.sku}</Box>
                  <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {sale.product.name}
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="right">{sale.quantity}</TableCell>
              <TableCell align="right">
                <CurrencyDisplay amount={sale.totalAmount} currency="EUR" variant="body2" />
              </TableCell>
              <TableCell align="center">
                {sale.isPromo ? (
                  <Chip label="Yes" color="success" size="small" />
                ) : (
                  <Chip label="No" size="small" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
