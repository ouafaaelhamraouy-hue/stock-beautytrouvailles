'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useTranslations } from 'next-intl';
import { BrandsTable } from '@/components/brands/BrandsTable';
import { LoadingState, ErrorState } from '@/components/ui';

interface Brand {
  id: string;
  name: string;
  country?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BrandsPage() {
  const t = useTranslations('nav');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/brands');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch brands');
      }
      const data = await response.json();
      setBrands(data.brands || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleRefresh = () => {
    fetchBrands();
  };

  if (loading && brands.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('brands')}
          </Typography>
          <LoadingState variant="table" rows={5} />
        </Box>
      </Container>
    );
  }

  if (error && brands.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('brands')}
          </Typography>
          <ErrorState message={error} onRetry={fetchBrands} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
          {t('brands')}
        </Typography>

        <Paper 
          elevation={2}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <BrandsTable
            brands={brands}
            onRefresh={handleRefresh}
          />
        </Paper>
      </Box>
    </Container>
  );
}
