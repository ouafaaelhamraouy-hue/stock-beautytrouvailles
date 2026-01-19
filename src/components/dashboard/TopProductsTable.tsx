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
  Link,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { CurrencyDisplay } from '@/components/ui';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: {
    name: string;
  };
}

interface TopProductsTableProps {
  products: Array<{
    product: Product;
    totalRevenue: number;
    totalQuantity: number;
    salesCount: number;
  }>;
}

export function TopProductsTable({ products }: TopProductsTableProps) {
  const t = useTranslations('nav');
  const router = useRouter();

  if (products.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No products with sales yet
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>#</strong></TableCell>
            <TableCell><strong>SKU</strong></TableCell>
            <TableCell><strong>Name</strong></TableCell>
            <TableCell><strong>Category</strong></TableCell>
            <TableCell align="right"><strong>Revenue</strong></TableCell>
            <TableCell align="right"><strong>Quantity Sold</strong></TableCell>
            <TableCell align="right"><strong>Sales Count</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((item, index) => (
            <TableRow
              key={item.product.id}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => router.push(`/products`)}
            >
              <TableCell>
                <Chip label={index + 1} size="small" color="primary" />
              </TableCell>
              <TableCell>{item.product.sku}</TableCell>
              <TableCell>{item.product.name}</TableCell>
              <TableCell>{item.product.category.name}</TableCell>
              <TableCell align="right">
                <CurrencyDisplay amount={item.totalRevenue} currency="EUR" variant="body2" />
              </TableCell>
              <TableCell align="right">{item.totalQuantity}</TableCell>
              <TableCell align="right">{item.salesCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
