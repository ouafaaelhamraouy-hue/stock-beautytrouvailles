'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { productSchema, type ProductFormData } from '@/lib/validations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: {
    id: string;
    sku: string;
    name: string;
    description?: string | null;
    categoryId: string;
    basePriceEUR: number;
    basePriceDH: number;
  };
  categories: Category[];
  loading?: boolean;
}

export function ProductForm({
  open,
  onClose,
  onSubmit,
  initialData,
  categories,
  loading = false,
}: ProductFormProps) {
  const t = useTranslations('common');
  const [exchangeRate, setExchangeRate] = useState(10.5); // Default exchange rate

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      sku: '',
      name: '',
      description: '',
      categoryId: '',
      basePriceEUR: 0,
      basePriceDH: 0,
    },
  });

  const basePriceEUR = watch('basePriceEUR');
  const basePriceDH = watch('basePriceDH');

  // Sync prices when one changes
  useEffect(() => {
    if (basePriceEUR && basePriceEUR > 0) {
      setValue('basePriceDH', basePriceEUR * exchangeRate, { shouldValidate: true });
    }
  }, [basePriceEUR, exchangeRate, setValue]);

  useEffect(() => {
    if (basePriceDH && basePriceDH > 0) {
      setValue('basePriceEUR', basePriceDH / exchangeRate, { shouldValidate: true });
    }
  }, [basePriceDH, exchangeRate, setValue]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      // Calculate exchange rate from initial data
      if (initialData.basePriceEUR > 0 && initialData.basePriceDH > 0) {
        setExchangeRate(initialData.basePriceDH / initialData.basePriceEUR);
      }
    } else {
      reset({
        sku: '',
        name: '',
        description: '',
        categoryId: '',
        basePriceEUR: 0,
        basePriceDH: 0,
      });
    }
  }, [initialData, reset]);

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
                  {...register('sku')}
                  label="SKU"
                  fullWidth
                  required
                  error={!!errors.sku}
                  helperText={errors.sku?.message}
                  disabled={!!initialData} // SKU cannot be changed after creation
                />
              </Grid>
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
              <Grid item xs={12}>
                <TextField
                  {...register('description')}
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('basePriceEUR', { valueAsNumber: true })}
                  label="Base Price (EUR)"
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  error={!!errors.basePriceEUR}
                  helperText={errors.basePriceEUR?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('basePriceDH', { valueAsNumber: true })}
                  label="Base Price (DH)"
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  error={!!errors.basePriceDH}
                  helperText={errors.basePriceDH?.message}
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
