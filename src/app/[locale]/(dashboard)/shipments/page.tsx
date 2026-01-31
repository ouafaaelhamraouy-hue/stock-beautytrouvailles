'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ShipmentsTable } from '@/components/shipments/ShipmentsTable';
import type { ShipmentFormData } from '@/lib/validations';
import { LoadingState, ErrorState } from '@/components/ui';
import { RouteGuard } from '@/components/auth/RouteGuard';

interface Shipment {
  id: string;
  reference: string;
  source: ShipmentFormData['source'];
  purchaseDate?: string | null;
  shipDate?: string | null;
  receivedDate?: string | null;
  status: 'PENDING' | 'PURCHASED' | 'SHIPPED' | 'IN_TRANSIT' | 'CUSTOMS' | 'RECEIVED';
  exchangeRate: number;
  shippingCostEUR: number;
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

type ShipmentApiItem = Shipment & {
  totalCostEur?: number | string | null;
  totalCostDh?: number | string | null;
  totalCostEUR?: number | string | null;
  totalCostDH?: number | string | null;
};

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
      const list = Array.isArray(data?.shipments) ? (data.shipments as ShipmentApiItem[]) : [];
      const normalized = list.map((shipment) => ({
        ...shipment,
        totalCostEUR:
          typeof shipment.totalCostEUR === 'number'
            ? shipment.totalCostEUR
            : Number(shipment.totalCostEur ?? 0),
        totalCostDH:
          typeof shipment.totalCostDH === 'number'
            ? shipment.totalCostDH
            : Number(shipment.totalCostDh ?? 0),
      }));
      setShipments(normalized);
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
