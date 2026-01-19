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
  FormControlLabel,
  Switch,
  Alert,
  Chip,
  Typography,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { saleSchema, type SaleFormData } from '@/lib/validations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CurrencyDisplay } from '@/components/ui';
import { calculateSaleTotal } from '@/lib/calculations';

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

interface SaleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: {
    id: string;
    productId: string;
    quantity: number;
    pricePerUnit: number;
    isPromo: boolean;
    saleDate: string;
  };
  products: Product[];
  loading?: boolean;
}

export function SaleForm({
  open,
  onClose,
  onSubmit,
  initialData,
  products,
  loading = false,
}: SaleFormProps) {
  const t = useTranslations('common');
  const tSales = useTranslations('sales');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [saleDate, setSaleDate] = useState<Date | null>(new Date());

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SaleFormData & { saleDate?: Date }>({
    resolver: zodResolver(saleSchema),
    defaultValues: initialData || {
      productId: '',
      quantity: 1,
      pricePerUnit: 0,
      isPromo: false,
      saleDate: new Date(),
    },
  });

  const quantity = watch('quantity');
  const pricePerUnit = watch('pricePerUnit');
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Calculate total amount
  const totalAmount = quantity && pricePerUnit ? calculateSaleTotal(quantity, pricePerUnit) : 0;

  // Suggest base price when product is selected
  useEffect(() => {
    if (selectedProduct && !initialData && pricePerUnit === 0) {
      setValue('pricePerUnit', selectedProduct.basePriceEUR, { shouldValidate: true });
    }
  }, [selectedProduct, initialData, pricePerUnit, setValue]);

  useEffect(() => {
    if (initialData) {
      reset({
        productId: initialData.productId,
        quantity: initialData.quantity,
        pricePerUnit: initialData.pricePerUnit,
        isPromo: initialData.isPromo,
        saleDate: new Date(initialData.saleDate),
      });
      setSelectedProductId(initialData.productId);
      setSaleDate(new Date(initialData.saleDate));
    } else {
      reset({
        productId: '',
        quantity: 1,
        pricePerUnit: 0,
        isPromo: false,
        saleDate: new Date(),
      });
      setSelectedProductId('');
      setSaleDate(new Date());
    }
  }, [initialData, reset]);

  // Validate quantity against available stock
  useEffect(() => {
    if (selectedProduct && quantity > selectedProduct.availableStock) {
      setValue('quantity', selectedProduct.availableStock, { shouldValidate: true });
      toast.error(`Maximum available stock: ${selectedProduct.availableStock}`);
    }
  }, [selectedProduct, quantity, setValue]);

  const handleFormSubmit = async (data: any) => {
    if (selectedProduct && data.quantity > selectedProduct.availableStock) {
      toast.error(tSales('insufficientStock'));
      return;
    }

    try {
      const submitData = {
        ...data,
        saleDate: saleDate?.toISOString() || new Date().toISOString(),
      };
      await onSubmit(submitData);
      reset();
      setSelectedProductId('');
      setSaleDate(new Date());
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save sale');
      console.error(error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogTitle>{initialData ? tSales('edit') : tSales('create')}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    {...register('productId')}
                    label={tSales('product')}
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
                        {product.sku} - {product.name} ({product.category.name}) -{' '}
                        <Chip
                          label={`${tSales('availableStock')}: ${product.availableStock}`}
                          size="small"
                          color={product.availableStock > 0 ? 'success' : 'error'}
                          sx={{ ml: 1 }}
                        />
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {selectedProduct && (
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {tSales('availableStock')}: <strong>{selectedProduct.availableStock}</strong>
                      {selectedProduct.availableStock === 0 && (
                        <span style={{ color: 'red', marginLeft: 8 }}>
                          {tSales('insufficientStock')}
                        </span>
                      )}
                    </Alert>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('quantity', { valueAsNumber: true })}
                    label={tSales('quantity')}
                    fullWidth
                    required
                    type="number"
                    inputProps={{
                      step: '1',
                      min: 1,
                      max: selectedProduct?.availableStock || undefined,
                    }}
                    error={!!errors.quantity}
                    helperText={
                      errors.quantity?.message ||
                      (selectedProduct
                        ? `Max: ${selectedProduct.availableStock}`
                        : '')
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label={tSales('saleDate')}
                    value={saleDate}
                    onChange={(newValue) => setSaleDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.saleDate,
                        helperText: errors.saleDate?.message,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('pricePerUnit', { valueAsNumber: true })}
                    label={tSales('pricePerUnit') + ' (EUR)'}
                    fullWidth
                    required
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    error={!!errors.pricePerUnit}
                    helperText={
                      errors.pricePerUnit?.message ||
                      (selectedProduct
                        ? `Base price: ${selectedProduct.basePriceEUR.toFixed(2)} EUR`
                        : '')
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        {...register('isPromo')}
                        checked={watch('isPromo')}
                        onChange={(e) => setValue('isPromo', e.target.checked)}
                      />
                    }
                    label={tSales('isPromo')}
                  />
                </Grid>
                {totalAmount > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <span>{tSales('totalAmount')}:</span>
                        <strong>
                          <CurrencyDisplay amount={totalAmount} currency="EUR" variant="h6" />
                        </strong>
                      </Box>
                      {selectedProduct && pricePerUnit > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2">Margin:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {selectedProduct.basePriceEUR > 0
                              ? (
                                  ((pricePerUnit - selectedProduct.basePriceEUR) /
                                    selectedProduct.basePriceEUR) *
                                  100
                                ).toFixed(1)
                              : '0'}{' '}
                            %
                          </Typography>
                        </Box>
                      )}
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
            <Button
              type="submit"
              variant="contained"
              disabled={loading || (selectedProduct ? quantity > selectedProduct.availableStock : false)}
            >
              {loading ? t('loading') : t('save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
}
