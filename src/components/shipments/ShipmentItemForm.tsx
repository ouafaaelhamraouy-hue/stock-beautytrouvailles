'use client';

import { useState, useEffect, useRef } from 'react';
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
  linkedProductIds?: string[];
  exchangeRate: number;
  loading?: boolean;
}

export function ShipmentItemForm({
  open,
  onClose,
  onSubmit,
  initialData,
  products,
  linkedProductIds = [],
  exchangeRate,
  loading = false,
}: ShipmentItemFormProps) {
  const t = useTranslations('common');
  const tShipments = useTranslations('shipments');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [costPerUnitDH, setCostPerUnitDH] = useState(0);
  const lastEdited = useRef<'EUR' | 'DH' | null>(null);

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
  const linkedIdSet = new Set(linkedProductIds);
  const round2 = (value: number) => Math.round(value * 100) / 100;
  const costPerUnitEurRegister = register('costPerUnitEUR', { valueAsNumber: true });

  // Suggest base price when product is selected
  useEffect(() => {
    if (selectedProduct && !initialData && costPerUnitEUR === 0) {
      const baseEur = selectedProduct.basePriceEUR ?? 0;
      setValue('costPerUnitEUR', baseEur, { shouldValidate: true });
      if (exchangeRate) {
        setCostPerUnitDH(round2(baseEur * exchangeRate));
      }
    }
  }, [selectedProduct, initialData, costPerUnitEUR, setValue, exchangeRate]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setSelectedProductId(initialData.productId);
      if (exchangeRate) {
        setCostPerUnitDH(round2(initialData.costPerUnitEUR * exchangeRate));
      } else {
        setCostPerUnitDH(0);
      }
    } else {
      reset({
        productId: '',
        quantity: 1,
        costPerUnitEUR: 0,
      });
      setSelectedProductId('');
      setCostPerUnitDH(0);
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (lastEdited.current === 'DH') return;
    if (!exchangeRate || Number.isNaN(exchangeRate)) return;
    setCostPerUnitDH(round2(Number(costPerUnitEUR || 0) * exchangeRate));
  }, [costPerUnitEUR, exchangeRate]);

  useEffect(() => {
    if (lastEdited.current !== 'DH') return;
    if (!exchangeRate || Number.isNaN(exchangeRate)) return;
    const eur = round2(Number(costPerUnitDH || 0) / exchangeRate);
    setValue('costPerUnitEUR', eur, { shouldValidate: true });
  }, [costPerUnitDH, exchangeRate, setValue]);

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
                  {products.map((product) => {
                    const isLinked = linkedIdSet.has(product.id);
                    return (
                      <MenuItem key={product.id} value={product.id} disabled={isLinked}>
                        {product.sku} - {product.name} ({product.category.name})
                        {isLinked ? ' — already in this shipment' : ''}
                      </MenuItem>
                    );
                  })}
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
                  {...costPerUnitEurRegister}
                  label={tShipments('costPerUnit') + ' (EUR)'}
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  error={!!errors.costPerUnitEUR}
                  helperText={errors.costPerUnitEUR?.message}
                  onChange={(event) => {
                    lastEdited.current = 'EUR';
                    costPerUnitEurRegister.onChange(event);
                  }}
                />
                {selectedProduct && (
                  <Box sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
                    Base price: {(selectedProduct.basePriceEUR ?? 0).toFixed(2)} EUR
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={tShipments('costPerUnit') + ' (DH)'}
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  value={Number.isFinite(costPerUnitDH) ? costPerUnitDH : 0}
                  onChange={(event) => {
                    lastEdited.current = 'DH';
                    setCostPerUnitDH(Number(event.target.value) || 0);
                  }}
                />
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
