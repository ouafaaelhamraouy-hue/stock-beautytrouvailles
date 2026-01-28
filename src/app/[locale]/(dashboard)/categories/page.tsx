'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useTranslations } from 'next-intl';
import { CategoriesTable } from '@/components/categories/CategoriesTable';
import { LoadingState, ErrorState } from '@/components/ui';

interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const t = useTranslations('nav');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/categories');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleRefresh = () => {
    fetchCategories();
  };

  if (loading && categories.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('categories')}
          </Typography>
          <LoadingState variant="table" rows={5} />
        </Box>
      </Container>
    );
  }

  if (error && categories.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('categories')}
          </Typography>
          <ErrorState message={error} onRetry={fetchCategories} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
          {t('categories')}
        </Typography>

        <Paper 
          elevation={2}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            mt: 3,
          }}
        >
          <CategoriesTable
            categories={categories}
            onRefresh={handleRefresh}
          />
        </Paper>
      </Box>
    </Container>
  );
}
