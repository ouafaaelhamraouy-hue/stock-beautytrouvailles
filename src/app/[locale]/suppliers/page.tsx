'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useTranslations } from 'next-intl';
import { SuppliersTable } from '@/components/suppliers/SuppliersTable';
import { LoadingState, ErrorState } from '@/components/ui';
import BusinessIcon from '@mui/icons-material/Business';

interface Supplier {
  id: string;
  name: string;
  contactInfo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SuppliersPage() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/suppliers');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch suppliers');
      }
      const data = await response.json();
      setSuppliers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleRefresh = () => {
    fetchSuppliers();
  };

  if (loading && suppliers.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Suppliers
          </Typography>
          <LoadingState variant="table" rows={5} />
        </Box>
      </Container>
    );
  }

  if (error && suppliers.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Suppliers
          </Typography>
          <ErrorState message={error} onRetry={fetchSuppliers} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
          Suppliers
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
          <SuppliersTable
            suppliers={suppliers}
            onRefresh={handleRefresh}
          />
        </Paper>
      </Box>
    </Container>
  );
}
