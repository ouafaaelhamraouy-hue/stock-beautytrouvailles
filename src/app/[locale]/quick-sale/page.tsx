'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useTranslations } from 'next-intl';
import { QuickSale } from '@/components/sales/QuickSale';
import { LoadingState, ErrorState } from '@/components/ui';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

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

export default function QuickSalePage() {
  const t = useTranslations('nav');
  const tSales = useTranslations('sales');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/products/available-stock');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSaleComplete = () => {
    // Refresh products after sale
    fetchProducts();
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {tSales('quickSale')}
          </Typography>
          <LoadingState variant="card" rows={5} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {tSales('quickSale')}
          </Typography>
          <ErrorState message={error} onRetry={fetchProducts} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 3 }}>
          {tSales('quickSale')}
        </Typography>

        <QuickSale products={products} onSaleComplete={handleSaleComplete} />
      </Box>
    </Container>
  );
}
