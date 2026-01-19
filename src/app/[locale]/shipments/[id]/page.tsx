'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/i18n/routing';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { LoadingState, ErrorState } from '@/components/ui';
import { StatsCard } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui';
import { ShipmentForm } from '@/components/shipments/ShipmentForm';
import { ShipmentItemForm } from '@/components/shipments/ShipmentItemForm';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';

interface ShipmentItem {
  id: string;
  product: {
    id: string;
    sku: string;
    name: string;
    category: {
      name: string;
    };
  };
  quantity: number;
  quantitySold: number;
  quantityRemaining: number;
  costPerUnitEUR: number;
  costPerUnitDH: number;
}

interface Shipment {
  id: string;
  reference: string;
  supplier: {
    id: string;
    name: string;
  };
  arrivalDate?: string | null;
  status: 'PENDING' | 'IN_TRANSIT' | 'ARRIVED' | 'PROCESSED';
  exchangeRate: number;
  shippingCostEUR: number;
  customsCostEUR: number;
  packagingCostEUR: number;
  totalCostEUR: number;
  totalCostDH: number;
  items: ShipmentItem[];
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

interface Product {
  id: string;
  sku: string;
  name: string;
  basePriceEUR: number;
  basePriceDH: number;
  category: {
    name: string;
  };
}

interface Supplier {
  id: string;
  name: string;
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const tShipments = useTranslations('shipments');
  const { profile } = useUserProfile();
  const shipmentId = params.id as string;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ShipmentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ShipmentItem | null>(null);

  const isAdmin = profile?.role === 'ADMIN';

  const fetchShipment = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/shipments/${shipmentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shipment');
      }
      const data = await response.json();
      setShipment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load shipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      const data = await response.json();
      setSuppliers(data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  useEffect(() => {
    fetchShipment();
    fetchProducts();
    fetchSuppliers();
  }, [shipmentId]);

  const handleRefresh = () => {
    fetchShipment();
  };

  const handleEditShipment = () => {
    setFormOpen(true);
  };

  const handleAddItem = () => {
    setItemToEdit(null);
    setItemFormOpen(true);
  };

  const handleEditItem = (item: ShipmentItem) => {
    setItemToEdit(item);
    setItemFormOpen(true);
  };

  const handleDeleteItem = (item: ShipmentItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteItemConfirm = async () => {
    if (!itemToDelete || !shipment) return;

    try {
      const response = await fetch(`/api/shipments/${shipmentId}/items/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete item');
      }

      toast.success('Item deleted successfully');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      handleRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const handleShipmentSubmit = async (data: any) => {
    if (!shipment) return;

    const response = await fetch(`/api/shipments/${shipment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save shipment');
    }

    toast.success('Shipment updated successfully');
    setFormOpen(false);
    handleRefresh();
  };

  const handleItemSubmit = async (data: any) => {
    if (!shipment) return;

    const url = itemToEdit
      ? `/api/shipments/${shipmentId}/items/${itemToEdit.id}`
      : `/api/shipments/${shipmentId}/items`;
    const method = itemToEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save item');
    }

    toast.success(itemToEdit ? 'Item updated successfully' : 'Item added successfully');
    setItemFormOpen(false);
    setItemToEdit(null);
    handleRefresh();
  };

  if (loading && !shipment) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <LoadingState variant="table" rows={5} />
        </Box>
      </Container>
    );
  }

  if (error && !shipment) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <ErrorState message={error} onRetry={fetchShipment} />
        </Box>
      </Container>
    );
  }

  if (!shipment) {
    return null;
  }

  const totals = shipment.calculatedTotals || {
    itemsCostEUR: 0,
    totalCostEUR: shipment.totalCostEUR,
    totalCostDH: shipment.totalCostDH,
    totalRevenueEUR: 0,
    totalRevenueDH: 0,
    profitEUR: 0,
    profitDH: 0,
    marginPercent: 0,
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      IN_TRANSIT: 'In Transit',
      ARRIVED: 'Arrived',
      PROCESSED: 'Processed',
    };
    return labels[status] || status;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/shipments')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
            {tShipments('reference')}: {shipment.reference}
          </Typography>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'SHIPMENTS_UPDATE') && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditShipment}
            >
              {t('edit')}
            </Button>
          )}
        </Box>

        {/* Shipment Info */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {tShipments('supplier')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {shipment.supplier.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {tShipments('status')}
              </Typography>
              <StatusBadge
                label={getStatusLabel(shipment.status)}
                status={shipment.status.toLowerCase().replace('_', '-') as any}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {tShipments('arrivalDate')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {shipment.arrivalDate ? new Date(shipment.arrivalDate).toLocaleDateString() : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {tShipments('exchangeRate')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {shipment.exchangeRate.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={tShipments('itemsCost')}
              value={<CurrencyDisplay amount={totals.itemsCostEUR} currency="EUR" variant="h4" />}
              icon={<ShoppingCartIcon sx={{ fontSize: 40 }} />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={tShipments('totalCost')}
              value={<CurrencyDisplay amount={totals.totalCostEUR} currency="EUR" variant="h4" />}
              icon={<InventoryIcon sx={{ fontSize: 40 }} />}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={tShipments('revenue')}
              value={<CurrencyDisplay amount={totals.totalRevenueEUR} currency="EUR" variant="h4" />}
              icon={<AttachMoneyIcon sx={{ fontSize: 40 }} />}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={tShipments('profit')}
              value={<CurrencyDisplay amount={totals.profitEUR} currency="EUR" variant="h4" />}
              icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
              color={totals.profitEUR >= 0 ? '#2e7d32' : '#d32f2f'}
              trend={{
                value: totals.marginPercent,
                isPositive: totals.profitEUR >= 0,
              }}
            />
          </Grid>
        </Grid>

        {/* Items Table */}
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {tShipments('items')}
            </Typography>
            {isAdmin && hasPermission(profile?.role || 'STAFF', 'SHIPMENTS_UPDATE') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                size="small"
              >
                {tShipments('addItem')}
              </Button>
            )}
          </Box>

          {shipment.items.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No items in this shipment. Add items to get started.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                    <TableCell><strong>{tShipments('product')}</strong></TableCell>
                    <TableCell align="right"><strong>{tShipments('quantity')}</strong></TableCell>
                    <TableCell align="right"><strong>{tShipments('sold')}</strong></TableCell>
                    <TableCell align="right"><strong>{tShipments('remaining')}</strong></TableCell>
                    <TableCell align="right"><strong>{tShipments('costPerUnit')} (EUR)</strong></TableCell>
                    <TableCell align="right"><strong>{tShipments('total')} (EUR)</strong></TableCell>
                    {isAdmin && (
                      <TableCell align="center"><strong>Actions</strong></TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shipment.items.map((item) => {
                    const itemTotal = item.quantity * item.costPerUnitEUR;
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.product.sku} - {item.product.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.product.category.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          <Chip label={item.quantitySold} size="small" color="success" />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={item.quantityRemaining}
                            size="small"
                            color={item.quantityRemaining > 0 ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <CurrencyDisplay amount={item.costPerUnitEUR} currency="EUR" variant="body2" />
                        </TableCell>
                        <TableCell align="right">
                          <CurrencyDisplay amount={itemTotal} currency="EUR" variant="body2" />
                        </TableCell>
                        {isAdmin && hasPermission(profile?.role || 'STAFF', 'SHIPMENTS_UPDATE') && (
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleEditItem(item)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteItem(item)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Forms */}
        <ShipmentForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleShipmentSubmit}
          initialData={shipment}
          suppliers={suppliers}
        />

        <ShipmentItemForm
          open={itemFormOpen}
          onClose={() => {
            setItemFormOpen(false);
            setItemToEdit(null);
          }}
          onSubmit={handleItemSubmit}
          initialData={itemToEdit || undefined}
          products={products}
          exchangeRate={shipment.exchangeRate}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={handleDeleteItemConfirm}
          title="Delete Item"
          message={`Are you sure you want to delete this item? This action cannot be undone.`}
          confirmColor="error"
          confirmLabel="Delete"
        />
      </Box>
    </Container>
  );
}
