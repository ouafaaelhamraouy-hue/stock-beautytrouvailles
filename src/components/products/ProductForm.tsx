'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
} from '@mui/material';
import { productSchema, type ProductFormData } from '@/lib/validations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: {
    id: string;
    name: string;
    brandId?: string | null;
    description?: string | null;
    categoryId: string;
    purchaseSource: 'ACTION' | 'CARREFOUR' | 'PHARMACIE' | 'AMAZON_FR' | 'SEPHORA' | 'RITUALS' | 'NOCIBE' | 'LIDL' | 'OTHER';
    purchasePriceEur?: number | null;
    purchasePriceMad: number;
    sellingPriceDh: number;
    promoPriceDh?: number | null;
    quantityReceived: number;
    reorderLevel: number;
  };
  categories: Category[];
  brands?: Brand[];
  loading?: boolean;
  exchangeRate?: number; // Exchange rate from arrivage or default
}

const PURCHASE_SOURCES = [
  { value: 'ACTION', label: 'Action' },
  { value: 'RITUALS', label: 'Rituals' },
  { value: 'NOCIBE', label: 'Nocibé' },
  { value: 'LIDL', label: 'Lidl' },
  { value: 'CARREFOUR', label: 'Carrefour' },
  { value: 'PHARMACIE', label: 'Pharmacie' },
  { value: 'AMAZON_FR', label: 'Amazon FR' },
  { value: 'SEPHORA', label: 'Sephora' },
  { value: 'OTHER', label: 'Autre' },
] as const;

export function ProductForm({
  open,
  onClose,
  onSubmit,
  initialData,
  categories,
  brands = [],
  loading = false,
  exchangeRate = 10.85, // Default exchange rate
}: ProductFormProps) {
  const t = useTranslations('common');
  const [currentExchangeRate, setCurrentExchangeRate] = useState(exchangeRate);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      brandId: initialData.brandId || null,
      description: initialData.description || null,
      categoryId: initialData.categoryId,
      purchaseSource: initialData.purchaseSource,
      purchasePriceEur: initialData.purchasePriceEur || null,
      purchasePriceMad: initialData.purchasePriceMad,
      sellingPriceDh: initialData.sellingPriceDh,
      promoPriceDh: initialData.promoPriceDh || null,
      quantityReceived: initialData.quantityReceived,
      reorderLevel: initialData.reorderLevel,
    } : {
      name: '',
      brandId: null,
      description: null,
      categoryId: '',
      purchaseSource: 'OTHER',
      purchasePriceEur: null,
      purchasePriceMad: 0,
      sellingPriceDh: 0,
      promoPriceDh: null,
      quantityReceived: 0,
      reorderLevel: 3,
    },
  });

  const purchasePriceEur = watch('purchasePriceEur');
  const purchasePriceMad = watch('purchasePriceMad');

  // Auto-calculate MAD when EUR changes
  useEffect(() => {
    if (purchasePriceEur && purchasePriceEur > 0) {
      const calculatedMad = purchasePriceEur * currentExchangeRate;
      setValue('purchasePriceMad', Number(calculatedMad.toFixed(2)), { shouldValidate: true });
    }
  }, [purchasePriceEur, currentExchangeRate, setValue]);

  // Auto-calculate EUR when MAD changes (if EUR is empty)
  useEffect(() => {
    if (purchasePriceMad && purchasePriceMad > 0 && (!purchasePriceEur || purchasePriceEur === 0)) {
      const calculatedEur = purchasePriceMad / currentExchangeRate;
      setValue('purchasePriceEur', Number(calculatedEur.toFixed(2)), { shouldValidate: true });
    }
  }, [purchasePriceMad, currentExchangeRate, setValue, purchasePriceEur]);

  useEffect(() => {
    setCurrentExchangeRate(exchangeRate);
  }, [exchangeRate]);

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        brandId: initialData.brandId || null,
        description: initialData.description || null,
        categoryId: initialData.categoryId,
        purchaseSource: initialData.purchaseSource,
        purchasePriceEur: initialData.purchasePriceEur || null,
        purchasePriceMad: initialData.purchasePriceMad,
        sellingPriceDh: initialData.sellingPriceDh,
        promoPriceDh: initialData.promoPriceDh || null,
        quantityReceived: initialData.quantityReceived,
        reorderLevel: initialData.reorderLevel,
      });
    } else {
      reset({
        name: '',
        brandId: null,
        description: null,
        categoryId: '',
        purchaseSource: 'OTHER',
        purchasePriceEur: null,
        purchasePriceMad: 0,
        sellingPriceDh: 0,
        promoPriceDh: null,
        quantityReceived: 0,
        reorderLevel: 3,
      });
    }
  }, [initialData, reset, open]);

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
      toast.success(initialData ? 'Product updated successfully' : 'Product created successfully');
    } catch (error) {
      toast.error('Failed to save product');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{initialData ? 'Edit Product' : 'Create Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('categoryId')}
                  label="Category"
                  fullWidth
                  required
                  select
                  error={!!errors.categoryId}
                  helperText={errors.categoryId?.message}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('purchaseSource')}
                  label="Purchase Source"
                  fullWidth
                  required
                  select
                  error={!!errors.purchaseSource}
                  helperText={errors.purchaseSource?.message}
                >
                  {PURCHASE_SOURCES.map((source) => (
                    <MenuItem key={source.value} value={source.value}>
                      {source.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register('name')}
                  label="Product Name"
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('brandId')}
                  label="Brand (optional)"
                  fullWidth
                  select
                  error={!!errors.brandId}
                  helperText={errors.brandId?.message}
                >
                  <MenuItem value="">None</MenuItem>
                  {brands.map((brand) => (
                    <MenuItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('quantityReceived', { valueAsNumber: true })}
                  label="Quantity Received"
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: '1', min: 0 }}
                  error={!!errors.quantityReceived}
                  helperText={errors.quantityReceived?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register('description')}
                  label="Description (optional)"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              </Grid>
              
              {/* Exchange Rate Info */}
              <Grid item xs={12}>
                <Box sx={{ p: 1.5, bgcolor: 'info.light', borderRadius: 1, mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Exchange Rate: 1 EUR = {currentExchangeRate.toFixed(4)} MAD
                  </Typography>
                </Box>
              </Grid>

              {/* Purchase Price - EUR */}
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('purchasePriceEur', { valueAsNumber: true })}
                  label="PA (Prix Achat) EUR"
                  fullWidth
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  error={!!errors.purchasePriceEur}
                  helperText={errors.purchasePriceEur?.message || 'Original price from receipt'}
                />
              </Grid>

              {/* Purchase Price - MAD */}
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('purchasePriceMad', { valueAsNumber: true })}
                  label="PA (Prix Achat) MAD"
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  error={!!errors.purchasePriceMad}
                  helperText={errors.purchasePriceMad?.message || 'Auto-calculated from EUR'}
                />
              </Grid>

              {/* Selling Price */}
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('sellingPriceDh', { valueAsNumber: true })}
                  label="PV (Prix Vente) MAD"
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  error={!!errors.sellingPriceDh}
                  helperText={errors.sellingPriceDh?.message}
                />
              </Grid>

              {/* Promo Price */}
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('promoPriceDh', { valueAsNumber: true })}
                  label="Promo Price MAD (optional)"
                  fullWidth
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  error={!!errors.promoPriceDh}
                  helperText={errors.promoPriceDh?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('reorderLevel', { valueAsNumber: true })}
                  label="Reorder Level"
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: '1', min: 0 }}
                  error={!!errors.reorderLevel}
                  helperText={errors.reorderLevel?.message}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? t('loading') : t('save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
