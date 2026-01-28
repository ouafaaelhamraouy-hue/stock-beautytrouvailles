'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ShipmentsTable } from '@/components/shipments/ShipmentsTable';
import { LoadingState, ErrorState } from '@/components/ui';
import { RouteGuard } from '@/components/auth/RouteGuard';

interface Shipment {
  id: string;
  reference: string;
  source: string;
  arrivalDate?: string | null;
  status: 'PENDING' | 'IN_TRANSIT' | 'ARRIVED' | 'PROCESSED';
  exchangeRate: number;
  shippingCostEUR: number;
  customsCostEUR: number;
  packagingCostEUR: number;
  totalCostEUR: number;
  totalCostDH: number;
  createdAt: string;
  updatedAt: string;
  calculatedTotals?: {
    itemsCostEUR: number;
    totalCostEUR: number;
    totalCostDH: number;
    totalRevenueEUR: number;
    totalRevenueDH: number;
    profitEUR: number;
    profitDH: number;
    marginPercent: number;
  };
}

export default function ShipmentsPage() {
  const t = useTranslations('nav');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/shipments');
      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }
      const data = await response.json();
      setShipments(data.shipments || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleRefresh = () => {
    fetchShipments();
  };

  if (loading && shipments.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('shipments')}
          </Typography>
          <LoadingState variant="table" rows={5} />
        </Box>
      </Container>
    );
  }

  if (error && shipments.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('shipments')}
          </Typography>
          <ErrorState message={error} onRetry={fetchShipments} />
        </Box>
      </Container>
    );
  }

  return (
    <RouteGuard requireAdmin>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('shipments')}
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
          <ShipmentsTable
            shipments={shipments}
            onRefresh={handleRefresh}
          />
        </Paper>
      </Box>
    </Container>
    </RouteGuard>
  );
}
