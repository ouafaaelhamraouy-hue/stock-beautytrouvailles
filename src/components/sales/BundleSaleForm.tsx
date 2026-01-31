'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Grid,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { CurrencyDisplay } from '@/components/ui';
import type { SaleFormData } from '@/lib/validations';

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

interface BundleItemDraft {
  productId: string;
  quantity: number;
  pricePerUnit: number;
  productName?: string;
}

interface BundleSaleInitialData {
  id: string;
  saleDate: string;
  notes?: string | null;
  items: BundleItemDraft[];
}

interface BundleSaleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SaleFormData & { saleDate: string }) => Promise<void>;
  products: Product[];
  initialData?: BundleSaleInitialData;
  loading?: boolean;
}

export function BundleSaleForm({
  open,
  onClose,
  onSubmit,
  products,
  initialData,
  loading = false,
}: BundleSaleFormProps) {
  const [items, setItems] = useState<BundleItemDraft[]>([
    { productId: '', quantity: 1, pricePerUnit: 0 },
    { productId: '', quantity: 1, pricePerUnit: 0 },
  ]);
  const [saleDate, setSaleDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setItems(initialData.items.length >= 2 ? initialData.items : [
        { productId: '', quantity: 1, pricePerUnit: 0 },
        { productId: '', quantity: 1, pricePerUnit: 0 },
      ]);
      setSaleDate(new Date(initialData.saleDate));
      setNotes(initialData.notes || '');
    } else {
      setItems([
        { productId: '', quantity: 1, pricePerUnit: 0 },
        { productId: '', quantity: 1, pricePerUnit: 0 },
      ]);
      setSaleDate(new Date());
      setNotes('');
    }
    setError(null);
  }, [initialData, open]);

  const productOptions = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    if (initialData) {
      for (const item of initialData.items) {
        if (!byId.has(item.productId)) {
          byId.set(item.productId, {
            id: item.productId,
            name: item.productName || 'Unknown product',
            sellingPriceDh: 0,
            promoPriceDh: null,
            purchasePriceMad: 0,
            availableStock: 0,
            category: { name: 'Unknown' },
          });
        }
      }
    }
    return Array.from(byId.values());
  }, [products, initialData]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);
  }, [items]);

  const handleItemChange = (index: number, patch: Partial<BundleItemDraft>) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, ...patch };
      if (patch.productId) {
        const product = productOptions.find((p) => p.id === patch.productId);
        if (product && (!item.pricePerUnit || item.pricePerUnit === 0)) {
          next.pricePerUnit = product.sellingPriceDh;
        }
      }
      return next;
    }));
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, pricePerUnit: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (items.length < 2) {
      setError('A bundle must include at least 2 products.');
      return false;
    }
    for (const item of items) {
      if (!item.productId) {
        setError('All bundle items must have a product.');
        return false;
      }
      if (!item.quantity || item.quantity < 1) {
        setError('All bundle items must have quantity >= 1.');
        return false;
      }
      if (item.pricePerUnit < 0) {
        setError('All bundle items must have a valid unit price.');
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await onSubmit({
        pricingMode: 'BUNDLE',
        items,
        bundlePriceTotal: totalAmount,
        saleDate: saleDate?.toISOString() || new Date().toISOString(),
        notes: notes || null,
      } as SaleFormData & { saleDate: string });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save bundle sale');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{initialData ? 'Edit Bundle Sale' : 'Create Bundle Sale'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Sale Date"
                  value={saleDate}
                  onChange={(newValue) => setSaleDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Notes (optional)"
                  fullWidth
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Bundle Items
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {items.map((item, index) => {
                const product = productOptions.find((p) => p.id === item.productId);
                return (
                  <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        select
                        label="Product"
                        fullWidth
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, { productId: e.target.value })}
                      >
                      {productOptions.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </TextField>
                      {product && (
                        <Typography variant="caption" color="text.secondary">
                          Available: {product.availableStock}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Quantity"
                        type="number"
                        fullWidth
                        inputProps={{ step: '1', min: 1 }}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, { quantity: Number(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Unit Price (MAD)"
                        type="number"
                        fullWidth
                        inputProps={{ step: '0.01', min: 0 }}
                        value={item.pricePerUnit}
                        onChange={(e) => handleItemChange(index, { pricePerUnit: Number(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton
                        aria-label="Remove item"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 2}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                );
              })}

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                sx={{ mt: 1 }}
              >
                Add Item
              </Button>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Bundle Total:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  <CurrencyDisplay amount={totalAmount} currency="DH" variant="body2" />
                </Typography>
              </Box>
            </Box>

            {error && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Bundle Sale'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
