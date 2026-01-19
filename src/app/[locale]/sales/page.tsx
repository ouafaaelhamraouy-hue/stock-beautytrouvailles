'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, TextField, MenuItem } from '@mui/material';
import { useTranslations } from 'next-intl';
import { SalesTable } from '@/components/sales/SalesTable';
import { LoadingState, ErrorState } from '@/components/ui';
import { SearchInput } from '@/components/ui';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { format } from 'date-fns';

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
  updatedAt: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  basePriceEUR: number;
  basePriceDH: number;
  availableStock: number;
  category: {
    name: string;
  };
}

export default function SalesPage() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tSales = useTranslations('sales');
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [productFilter, setProductFilter] = useState<string>('');
  const [isPromoFilter, setIsPromoFilter] = useState<string>('');

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (productFilter) {
        params.append('productId', productFilter);
      }
      if (startDate) {
        params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      }
      if (isPromoFilter !== '') {
        params.append('isPromo', isPromoFilter);
      }

      const response = await fetch(`/api/sales?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales');
      }
      const data = await response.json();
      setSales(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/available-stock');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Debounce filters
    const timer = setTimeout(() => {
      fetchSales();
    }, 300);

    return () => clearTimeout(timer);
  }, [startDate, endDate, productFilter, isPromoFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    fetchSales();
  };

  if (loading && sales.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('sales')}
          </Typography>
          <LoadingState variant="table" rows={5} />
        </Box>
      </Container>
    );
  }

  if (error && sales.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('sales')}
          </Typography>
          <ErrorState message={error} onRetry={fetchSales} />
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('sales')}
          </Typography>

          {/* Filters */}
          <Paper 
            elevation={2}
            sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                <TextField
                  select
                  label={tSales('product')}
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">All Products</MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.sku} - {product.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ minWidth: 180 }}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 180 }}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Box>
              <TextField
                select
                label="Promo"
                value={isPromoFilter}
                onChange={(e) => setIsPromoFilter(e.target.value)}
                sx={{ minWidth: 150 }}
                size="small"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Promo Only</MenuItem>
                <MenuItem value="false">Non-Promo</MenuItem>
              </TextField>
            </Box>
          </Paper>

          {/* Sales Table */}
          <Paper 
            elevation={2}
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <SalesTable
              sales={sales}
              products={products}
              onRefresh={handleRefresh}
            />
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
}
