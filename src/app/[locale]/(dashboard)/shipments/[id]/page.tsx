'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
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
import { ExpensesTable } from '@/components/expenses/ExpensesTable';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission, isAdmin as isAdminRole } from '@/lib/permissions';
import type { ShipmentFormData, ShipmentItemFormData } from '@/lib/validations';
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

interface Expense {
  id: string;
  date: string;
  amountEUR: number | { toNumber: () => number };
  amountDH: number | { toNumber: () => number };
  description: string;
  type: 'OPERATIONAL' | 'MARKETING' | 'UTILITIES' | 'PACKAGING' | 'SHIPPING' | 'ADS' | 'OTHER';
  shipmentId?: string | null;
  arrivageId?: string | null;
  shipment?: {
    id: string;
    reference: string;
    supplier: {
      name: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Shipment {
  id: string;
  reference: string;
  source: string;
  purchaseDate?: string | null;
  shipDate?: string | null;
  receivedDate?: string | null;
  status: 'PENDING' | 'PURCHASED' | 'SHIPPED' | 'IN_TRANSIT' | 'CUSTOMS' | 'RECEIVED';
  exchangeRate: number;
  shippingCostEUR: number;
  packagingCostEUR: number;
  totalCostEur: number;
  totalCostDh: number;
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

const PURCHASE_SOURCE_LABELS: Record<string, string> = {
  ACTION: 'Action',
  RITUALS: 'Rituals',
  NOCIBE: 'Nocibé',
  LIDL: 'Lidl',
  CARREFOUR: 'Carrefour',
  PHARMACIE: 'Pharmacie',
  AMAZON_FR: 'Amazon FR',
  SEPHORA: 'Sephora',
  OTHER: 'Other',
};

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('common');
  const tShipments = useTranslations('shipments');
  const { profile } = useUserProfile();
  const shipmentId = params.id as string;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profitStats, setProfitStats] = useState<{
    totalRevenueEur: number;
    totalRevenueDh: number;
    netProfitEur: number;
    netProfitDh: number;
    marginPercent: number;
    salesCount: number;
    totalQuantitySold: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ShipmentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ShipmentItem | null>(null);

  const isAdmin = profile ? isAdminRole(profile.role) : false;

  const fetchShipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/shipments/${shipmentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shipment');
      }
      const data = await response.json();
      const toNumber = (value: unknown) =>
        typeof value === 'number'
          ? value
          : typeof (value as { toNumber?: () => number })?.toNumber === 'function'
            ? (value as { toNumber: () => number }).toNumber()
            : Number(value) || 0;

      const exchangeRateValue = toNumber(data.exchangeRate);
      const items = (data.items ?? data.products ?? []).map((product: any) => {
        const quantityReceived = Number(product.quantityReceived) || 0;
        const quantitySold = Number(product.quantitySold) || 0;
        const purchasePriceEur = toNumber(product.purchasePriceEur);
        const purchasePriceMad = toNumber(product.purchasePriceMad);
        const costPerUnitEUR = Number.isFinite(purchasePriceEur)
          ? purchasePriceEur
          : (exchangeRateValue ? purchasePriceMad / exchangeRateValue : 0);
        const costPerUnitDH = Number.isFinite(purchasePriceMad)
          ? purchasePriceMad
          : costPerUnitEUR * exchangeRateValue;
        return {
          id: product.id,
          product: {
            id: product.id,
            sku: product.sku || product.name,
            name: product.name,
            category: {
              name: product.category?.name || '',
            },
          },
          quantity: quantityReceived,
          quantitySold,
          quantityRemaining: Math.max(0, quantityReceived - quantitySold),
          costPerUnitEUR,
          costPerUnitDH,
        };
      });
      const itemsCostEUR = items.reduce((sum, item) => sum + item.quantity * item.costPerUnitEUR, 0);
      const totalCostEUR = toNumber(data.totalCostEur) || itemsCostEUR;
      const totalCostDH = toNumber(data.totalCostDh) || totalCostEUR * exchangeRateValue;

      setShipment({
        ...data,
        exchangeRate: exchangeRateValue,
        totalCostEur: totalCostEUR,
        totalCostDh: totalCostDH,
        calculatedTotals: {
          itemsCostEUR,
          totalCostEUR,
          totalCostDH,
          totalRevenueEUR: 0,
          totalRevenueDH: 0,
          profitEUR: 0,
          profitDH: 0,
          marginPercent: 0,
        },
        items,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load shipment');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.products || []);
      const mapped = list.map((product: any) => ({
        id: product.id,
        sku: product.sku || product.name,
        name: product.name,
        basePriceEUR: Number(product.purchasePriceEur ?? product.purchasePriceEUR ?? 0),
        basePriceDH: Number(product.purchasePriceMad ?? product.purchasePriceMAD ?? 0),
        category: {
          name: product.category?.name || '',
        },
      }));
      setProducts(mapped);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      setExpensesLoading(true);
      const response = await fetch(`/api/expenses?arrivageId=${shipmentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      setExpenses(Array.isArray(data) ? data : (data.expenses || []));
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  }, [shipmentId]);

  const fetchProfitStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/shipments/${shipmentId}/stats`);
      if (!response.ok) return;
      const data = await response.json();
      setProfitStats({
        totalRevenueEur: Number(data.totalRevenueEur) || 0,
        totalRevenueDh: Number(data.totalRevenueDh) || 0,
        netProfitEur: Number(data.netProfitEur) || 0,
        netProfitDh: Number(data.netProfitDh) || 0,
        marginPercent: Number(data.marginPercent) || 0,
        salesCount: Number(data.salesCount) || 0,
        totalQuantitySold: Number(data.totalQuantitySold) || 0,
      });
    } catch (err) {
      console.error('Failed to fetch shipment profit stats:', err);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchShipment();
    fetchProducts();
    fetchExpenses();
    fetchProfitStats();
  }, [fetchShipment, fetchProducts, fetchExpenses, fetchProfitStats]);

  const handleRefresh = () => {
    fetchShipment();
    fetchExpenses();
    fetchProfitStats();
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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete item');
    }
  };

  const handleShipmentSubmit = async (data: ShipmentFormData & { status: string }) => {
    if (!shipment) return;

    // Map form data to API format
    const apiData = {
      reference: data.reference,
      source: data.source,
      purchaseDate: data.purchaseDate,
      shipDate: data.shipDate,
      receivedDate: data.receivedDate,
      status: data.status,
      exchangeRate: data.exchangeRate,
      shippingCostEur: data.shippingCostEUR,
      packagingCostEur: data.packagingCostEUR,
      totalCostEur: data.totalCostEUR,
    };

    const response = await fetch(`/api/shipments/${shipment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save shipment');
    }

    toast.success('Shipment updated successfully');
    setFormOpen(false);
    handleRefresh();
  };

  const handleItemSubmit = async (data: ShipmentItemFormData) => {
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

  type StatusTone = 'success' | 'error' | 'warning' | 'info' | 'default';
  const getStatusTone = (status: string): StatusTone => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'PURCHASED':
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'info';
      case 'CUSTOMS':
        return 'warning';
      case 'RECEIVED':
        return 'success';
      default:
        return 'default';
    }
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

  const itemsCostEUR = shipment.items.reduce(
    (sum, item) => sum + item.quantity * item.costPerUnitEUR,
    0
  );
  const totals = {
    itemsCostEUR,
    totalCostEUR: shipment.totalCostEur,
    totalCostDH: shipment.totalCostDh,
    totalRevenueEUR: profitStats?.totalRevenueEur ?? 0,
    totalRevenueDH: profitStats?.totalRevenueDh ?? 0,
    profitEUR: profitStats?.netProfitEur ?? 0,
    profitDH: profitStats?.netProfitDh ?? 0,
    marginPercent: profitStats?.marginPercent ?? 0,
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      PURCHASED: 'Purchased',
      SHIPPED: 'Shipped',
      IN_TRANSIT: 'In Transit',
      CUSTOMS: 'Customs',
      RECEIVED: 'Received',
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
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'ARRIVAGES_UPDATE') && (
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
                Purchase Source
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {PURCHASE_SOURCE_LABELS[shipment.source] || shipment.source}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {tShipments('status')}
              </Typography>
              <StatusBadge
                label={getStatusLabel(shipment.status)}
                status={getStatusTone(shipment.status)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {tShipments('purchaseDate')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {shipment.purchaseDate ? new Date(shipment.purchaseDate).toLocaleDateString() : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {tShipments('shipDate')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {shipment.shipDate ? new Date(shipment.shipDate).toLocaleDateString() : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {tShipments('receivedDate')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {shipment.receivedDate ? new Date(shipment.receivedDate).toLocaleDateString() : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {tShipments('exchangeRate')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {Number(shipment.exchangeRate).toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={tShipments('itemsCost')}
              value={
                <Box>
                  <CurrencyDisplay
                    amount={totals.itemsCostEUR * shipment.exchangeRate}
                    currency="DH"
                    variant="h4"
                  />
                  <Typography variant="body2" color="text.secondary">
                    <CurrencyDisplay
                      amount={totals.itemsCostEUR}
                      currency="EUR"
                      variant="body2"
                    />
                  </Typography>
                </Box>
              }
              icon={<ShoppingCartIcon sx={{ fontSize: 40 }} />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={tShipments('totalCost')}
              value={
                <Box>
                  <CurrencyDisplay amount={totals.totalCostDH} currency="DH" variant="h4" />
                  <Typography variant="body2" color="text.secondary">
                    <CurrencyDisplay amount={totals.totalCostEUR} currency="EUR" variant="body2" />
                  </Typography>
                </Box>
              }
              icon={<InventoryIcon sx={{ fontSize: 40 }} />}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={tShipments('revenue')}
              value={
                <Box>
                  <CurrencyDisplay amount={totals.totalRevenueDH} currency="DH" variant="h4" />
                  <Typography variant="body2" color="text.secondary">
                    <CurrencyDisplay
                      amount={totals.totalRevenueEUR}
                      currency="EUR"
                      variant="body2"
                    />
                  </Typography>
                </Box>
              }
              icon={<AttachMoneyIcon sx={{ fontSize: 40 }} />}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title={tShipments('profit')}
              value={
                <Box>
                  <CurrencyDisplay amount={totals.profitDH} currency="DH" variant="h4" />
                  <Typography variant="body2" color="text.secondary">
                    <CurrencyDisplay
                      amount={totals.profitEUR}
                      currency="EUR"
                      variant="body2"
                    />
                  </Typography>
                </Box>
              }
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
            {isAdmin && hasPermission(profile?.role || 'STAFF', 'ARRIVAGES_UPDATE') && (
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
                    <TableCell align="right"><strong>{tShipments('costPerUnit')} (DH)</strong></TableCell>
                    <TableCell align="right"><strong>{tShipments('total')} (EUR)</strong></TableCell>
                    <TableCell align="right"><strong>{tShipments('total')} (DH)</strong></TableCell>
                    {isAdmin && (
                      <TableCell align="center"><strong>Actions</strong></TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shipment.items.map((item) => {
                        const itemTotal = item.quantity * item.costPerUnitEUR;
                        const itemTotalDh = item.quantity * item.costPerUnitDH;
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
                          <CurrencyDisplay amount={item.costPerUnitDH} currency="DH" variant="body2" />
                        </TableCell>
                        <TableCell align="right">
                          <CurrencyDisplay amount={itemTotal} currency="EUR" variant="body2" />
                        </TableCell>
                        <TableCell align="right">
                          <CurrencyDisplay amount={itemTotalDh} currency="DH" variant="body2" />
                        </TableCell>
                        {isAdmin && hasPermission(profile?.role || 'STAFF', 'ARRIVAGES_UPDATE') && (
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

        {/* Expenses (Charges) */}
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mt: 3 }}>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Charges
            </Typography>
          </Box>
          {expensesLoading ? (
            <Box sx={{ p: 4 }}>
              <Typography color="text.secondary">Loading charges…</Typography>
            </Box>
          ) : (
            <ExpensesTable
              expenses={expenses}
              shipments={[{ id: shipment.id, reference: shipment.reference, supplier: { name: shipment.source } }]}
              onRefresh={handleRefresh}
              showShipmentColumn={false}
              defaultShipmentId={shipment.id}
              exchangeRate={shipment.exchangeRate}
            />
          )}
        </Paper>

        {/* Forms */}
        <ShipmentForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleShipmentSubmit}
          initialData={shipment ? {
            id: shipment.id,
            reference: shipment.reference,
            source: shipment.source as ShipmentFormData['source'],
            purchaseDate: shipment.purchaseDate,
            shipDate: shipment.shipDate,
            receivedDate: shipment.receivedDate,
            status: shipment.status,
            exchangeRate: shipment.exchangeRate,
            shippingCostEUR: shipment.shippingCostEUR,
            packagingCostEUR: shipment.packagingCostEUR,
            totalCostEUR: shipment.totalCostEur,
          } : undefined}
        />

      <ShipmentItemForm
        open={itemFormOpen}
        onClose={() => {
          setItemFormOpen(false);
          setItemToEdit(null);
        }}
        onSubmit={handleItemSubmit}
        initialData={itemToEdit ? {
          id: itemToEdit.id,
          productId: itemToEdit.product.id,
          quantity: itemToEdit.quantity,
          costPerUnitEUR: itemToEdit.costPerUnitEUR,
        } : undefined}
        products={products}
        linkedProductIds={shipment.items.map((item) => item.product.id)}
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
