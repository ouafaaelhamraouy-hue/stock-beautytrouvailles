'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, TextField, MenuItem } from '@mui/material';
import { useTranslations } from 'next-intl';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { LoadingState, ErrorState, SearchInput } from '@/components/ui';
import WarehouseIcon from '@mui/icons-material/Warehouse';

interface InventoryItem {
  id: string;
  product: {
    id: string;
    sku: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  shipment: {
    id: string;
    reference: string;
    supplier: {
      name: string;
    };
  };
  quantity: number;
  quantitySold: number;
  quantityRemaining: number;
  stockPercentage: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  costPerUnitEUR: number;
  costPerUnitDH: number;
}

interface Category {
  id: string;
  name: string;
}

interface Shipment {
  id: string;
  reference: string;
}

export default function InventoryPage() {
  const t = useTranslations('nav');
  const tInventory = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipmentFilter, setShipmentFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockLevelFilter, setStockLevelFilter] = useState<string>('all');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (shipmentFilter) {
        params.append('shipmentId', shipmentFilter);
      }
      if (categoryFilter) {
        params.append('categoryId', categoryFilter);
      }
      if (stockLevelFilter && stockLevelFilter !== 'all') {
        params.append('stockLevel', stockLevelFilter);
      }

      const response = await fetch(`/api/inventory?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      const data = await response.json();
      setItems(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    }
  };

  const fetchShipments = async () => {
    try {
      const response = await fetch('/api/shipments');
      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }
      const data = await response.json();
      setShipments(data || []);
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
      setShipments([]);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchCategories();
    fetchShipments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 300);

    return () => clearTimeout(timer);
  }, [shipmentFilter, categoryFilter, stockLevelFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    fetchInventory();
  };

  if (loading && items.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('inventory')}
          </Typography>
          <LoadingState variant="table" rows={5} />
        </Box>
      </Container>
    );
  }

  if (error && items.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('inventory')}
          </Typography>
          <ErrorState message={error} onRetry={fetchInventory} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
          {t('inventory')}
        </Typography>

        {/* Filters */}
        <Paper 
          elevation={2}
          sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 2,
            background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            {tInventory('filterBy')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              select
              label={tInventory('category')}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ minWidth: 200 }}
              size="small"
            >
              <MenuItem value="">{tCommon('allCategories')}</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={tInventory('shipment')}
              value={shipmentFilter}
              onChange={(e) => setShipmentFilter(e.target.value)}
              sx={{ minWidth: 200 }}
              size="small"
            >
              <MenuItem value="">All Shipments</MenuItem>
              {shipments.map((shipment) => (
                <MenuItem key={shipment.id} value={shipment.id}>
                  {shipment.reference}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={tInventory('stockLevel')}
              value={stockLevelFilter}
              onChange={(e) => setStockLevelFilter(e.target.value)}
              sx={{ minWidth: 200 }}
              size="small"
            >
              <MenuItem value="all">{tInventory('all')}</MenuItem>
              <MenuItem value="in_stock">{tInventory('inStock')}</MenuItem>
              <MenuItem value="low_stock">{tInventory('lowStock')}</MenuItem>
              <MenuItem value="out_of_stock">{tInventory('outOfStock')}</MenuItem>
            </TextField>
          </Box>
        </Paper>

        {/* Inventory Table */}
        <Paper 
          elevation={2}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <InventoryTable items={items} />
        </Paper>
      </Box>
    </Container>
  );
}
