'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
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
import { BundleSaleForm } from '@/components/sales/BundleSaleForm';
import { ConfirmDialog } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission, isAdmin as isAdminRole } from '@/lib/permissions';
import type { SaleFormData } from '@/lib/validations';

interface Sale {
  id: string;
  saleDate: string;
  product?: {
    id: string;
    name: string;
    category: {
      name: string;
    };
  } | null;
  quantity?: number | null;
  pricePerUnit?: number | null;
  totalAmount: number;
  pricingMode: 'REGULAR' | 'PROMO' | 'CUSTOM' | 'BUNDLE';
  items?: Array<{
    productId: string;
    quantity: number;
    pricePerUnit: number;
    product: {
      id: string;
      name: string;
      category: {
        name: string;
      };
    };
  }>;
  isPromo: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  sellingPriceDh: number;
  promoPriceDh: number | null;
  purchasePriceMad: number;
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
  const [bundleFormOpen, setBundleFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isAdmin = profile ? isAdminRole(profile.role) : false;

  const fetchSale = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/sales/${saleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sale');
      }
      const data = await response.json();
      setSale(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sale');
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  const fetchProducts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchSale();
    fetchProducts();
  }, [fetchSale, fetchProducts]);

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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete sale');
    }
  };

  const handleFormSubmit = async (data: SaleFormData) => {
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

  const handleBundleSubmit = async (data: SaleFormData) => {
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

    toast.success('Bundle sale updated successfully');
    setBundleFormOpen(false);
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
              onClick={() => {
                if (sale.pricingMode === 'BUNDLE') {
                  setBundleFormOpen(true);
                } else {
                  setFormOpen(true);
                }
              }}
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
            initialData={sale && sale.pricingMode !== 'BUNDLE' ? {
              id: sale.id,
              productId: sale.product?.id || '',
              quantity: sale.quantity || 1,
              pricePerUnit: sale.pricePerUnit || 0,
              pricingMode: sale.pricingMode,
              isPromo: sale.isPromo,
              saleDate: sale.saleDate,
            } : undefined}
            products={products}
          />

          <BundleSaleForm
            open={bundleFormOpen}
            onClose={() => setBundleFormOpen(false)}
            onSubmit={handleBundleSubmit}
            initialData={sale && sale.items ? {
              id: sale.id,
              saleDate: sale.saleDate,
              notes: sale.notes,
              items: sale.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                productName: item.product.name,
              })),
            } : undefined}
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
