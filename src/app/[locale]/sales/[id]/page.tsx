'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/i18n/routing';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { LoadingState, ErrorState } from '@/components/ui';
import { Receipt } from '@/components/sales/Receipt';
import { SaleForm } from '@/components/sales/SaleForm';
import { ConfirmDialog } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';

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

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('common');
  const tSales = useTranslations('sales');
  const { profile } = useUserProfile();
  const saleId = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isAdmin = profile?.role === 'ADMIN';

  const fetchSale = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/sales/${saleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sale');
      }
      const data = await response.json();
      setSale(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sale');
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
    fetchSale();
    fetchProducts();
  }, [saleId]);

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sale) return;

    try {
      const response = await fetch(`/api/sales/${sale.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete sale');
      }

      toast.success('Sale deleted successfully');
      router.push('/sales');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sale');
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!sale) return;

    const response = await fetch(`/api/sales/${sale.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save sale');
    }

    toast.success('Sale updated successfully');
    setFormOpen(false);
    fetchSale();
  };

  if (loading && !sale) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <LoadingState variant="card" rows={3} />
        </Box>
      </Container>
    );
  }

  if (error && !sale) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <ErrorState message={error} onRetry={fetchSale} />
        </Box>
      </Container>
    );
  }

  if (!sale) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/sales')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
            {tSales('receipt')}
          </Typography>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'SALES_UPDATE') && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setFormOpen(true)}
              sx={{ mr: 1 }}
            >
              {t('edit')}
            </Button>
          )}
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'SALES_DELETE') && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              {t('delete')}
            </Button>
          )}
        </Box>

        {/* Receipt */}
        <Receipt sale={sale} />

        {/* Forms */}
        <SaleForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={sale}
          products={products}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Sale"
          message="Are you sure you want to delete this sale? Stock will be restored."
          confirmColor="error"
          confirmLabel="Delete"
        />
      </Box>
    </Container>
  );
}
