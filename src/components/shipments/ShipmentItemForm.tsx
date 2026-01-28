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
import { shipmentItemSchema, type ShipmentItemFormData } from '@/lib/validations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

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

interface ShipmentItemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ShipmentItemFormData) => Promise<void>;
  initialData?: {
    id: string;
    productId: string;
    quantity: number;
    costPerUnitEUR: number;
  };
  products: Product[];
  exchangeRate: number;
  loading?: boolean;
}

export function ShipmentItemForm({
  open,
  onClose,
  onSubmit,
  initialData,
  products,
  exchangeRate,
  loading = false,
}: ShipmentItemFormProps) {
  const t = useTranslations('common');
  const tShipments = useTranslations('shipments');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ShipmentItemFormData>({
    resolver: zodResolver(shipmentItemSchema),
    defaultValues: initialData || {
      productId: '',
      quantity: 1,
      costPerUnitEUR: 0,
    },
  });

  const costPerUnitEUR = watch('costPerUnitEUR');
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Suggest base price when product is selected
  useEffect(() => {
    if (selectedProduct && !initialData && costPerUnitEUR === 0) {
      setValue('costPerUnitEUR', selectedProduct.basePriceEUR, { shouldValidate: true });
    }
  }, [selectedProduct, initialData, costPerUnitEUR, setValue]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setSelectedProductId(initialData.productId);
    } else {
      reset({
        productId: '',
        quantity: 1,
        costPerUnitEUR: 0,
      });
      setSelectedProductId('');
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: ShipmentItemFormData) => {
    try {
      await onSubmit(data);
      reset();
      setSelectedProductId('');
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save shipment item');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>
          {initialData ? tShipments('editItem') : tShipments('addItem')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  {...register('productId')}
                  label={tShipments('product')}
                  fullWidth
                  required
                  select
                  error={!!errors.productId}
                  helperText={errors.productId?.message}
                  disabled={!!initialData} // Product cannot be changed after creation
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setValue('productId', e.target.value, { shouldValidate: true });
                  }}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.sku} - {product.name} ({product.category.name})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('quantity', { valueAsNumber: true })}
                  label={tShipments('quantity')}
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: '1', min: 1 }}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('costPerUnitEUR', { valueAsNumber: true })}
                  label={tShipments('costPerUnit') + ' (EUR)'}
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  error={!!errors.costPerUnitEUR}
                  helperText={errors.costPerUnitEUR?.message}
                />
                {selectedProduct && (
                  <Box sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
                    Base price: {selectedProduct.basePriceEUR.toFixed(2)} EUR
                  </Box>
                )}
              </Grid>
              {costPerUnitEUR > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <span>Cost per unit (DH):</span>
                      <strong>{(costPerUnitEUR * exchangeRate).toFixed(2)} DH</strong>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total cost (EUR):</span>
                      <strong>
                        {(watch('quantity') * costPerUnitEUR).toFixed(2)} EUR
                      </strong>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total cost (DH):</span>
                      <strong>
                        {(watch('quantity') * costPerUnitEUR * exchangeRate).toFixed(2)} DH
                      </strong>
                    </Box>
                  </Box>
                </Grid>
              )}
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
