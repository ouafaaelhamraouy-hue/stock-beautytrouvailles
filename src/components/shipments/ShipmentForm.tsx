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
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { shipmentSchema, type ShipmentFormData } from '@/lib/validations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const PURCHASE_SOURCES = [
  { value: 'ACTION', label: 'Action' },
  { value: 'RITUALS', label: 'Rituals' },
  { value: 'NOCIBE', label: 'Nocibé' },
  { value: 'LIDL', label: 'Lidl' },
  { value: 'CARREFOUR', label: 'Carrefour' },
  { value: 'PHARMACIE', label: 'Pharmacie' },
  { value: 'AMAZON_FR', label: 'Amazon FR' },
  { value: 'SEPHORA', label: 'Sephora' },
  { value: 'OTHER', label: 'Other' },
] as const;

interface ShipmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ShipmentFormData & { status: string }) => Promise<void>;
  initialData?: {
    id: string;
    reference: string;
    source: string;
    arrivalDate?: string | null;
    status: string;
    exchangeRate: number;
    shippingCostEUR: number;
    customsCostEUR: number;
    packagingCostEUR: number;
  };
  loading?: boolean;
}

export function ShipmentForm({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: ShipmentFormProps) {
  const t = useTranslations('common');
  const tShipments = useTranslations('shipments');
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ShipmentFormData & { status: string }>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: initialData || {
      reference: '',
      source: 'OTHER',
      arrivalDate: undefined,
      status: 'PENDING',
      exchangeRate: 10.85,
      shippingCostEUR: 0,
      customsCostEUR: 0,
      packagingCostEUR: 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        reference: initialData.reference,
        source: initialData.source || 'OTHER',
        arrivalDate: initialData.arrivalDate ? new Date(initialData.arrivalDate) : undefined,
        status: initialData.status,
        exchangeRate: initialData.exchangeRate,
        shippingCostEUR: initialData.shippingCostEUR,
        customsCostEUR: initialData.customsCostEUR,
        packagingCostEUR: initialData.packagingCostEUR,
      });
      setArrivalDate(initialData.arrivalDate ? new Date(initialData.arrivalDate) : null);
    } else {
      reset({
        reference: '',
        source: 'OTHER',
        arrivalDate: undefined,
        status: 'PENDING',
        exchangeRate: 10.85,
        shippingCostEUR: 0,
        customsCostEUR: 0,
        packagingCostEUR: 0,
      });
      setArrivalDate(null);
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: ShipmentFormData & { status: string }) => {
    try {
      const submitData = {
        ...data,
        arrivalDate: arrivalDate?.toISOString() || null,
      };
      await onSubmit(submitData);
      reset();
      setArrivalDate(null);
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save shipment');
      console.error(error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogTitle>{initialData ? tShipments('edit') : tShipments('create')}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('reference')}
                    label={tShipments('reference')}
                    fullWidth
                    required
                    error={!!errors.reference}
                    helperText={errors.reference?.message}
                    disabled={!!initialData} // Reference cannot be changed after creation
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('source')}
                    label="Purchase Source"
                    fullWidth
                    required
                    select
                    error={!!errors.source}
                    helperText={errors.source?.message}
                  >
                    {PURCHASE_SOURCES.map((source) => (
                      <MenuItem key={source.value} value={source.value}>
                        {source.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label={tShipments('arrivalDate')}
                    value={arrivalDate}
                    onChange={(newValue) => setArrivalDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.arrivalDate,
                        helperText: errors.arrivalDate?.message,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('status')}
                    label={tShipments('status')}
                    fullWidth
                    required
                    select
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
                    <MenuItem value="ARRIVED">Arrived</MenuItem>
                    <MenuItem value="PROCESSED">Processed</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('exchangeRate', { valueAsNumber: true })}
                    label={tShipments('exchangeRate')}
                    fullWidth
                    required
                    type="number"
                    inputProps={{ step: '0.01', min: 0.01 }}
                    error={!!errors.exchangeRate}
                    helperText={errors.exchangeRate?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    {...register('shippingCostEUR', { valueAsNumber: true })}
                    label={tShipments('shippingCost')}
                    fullWidth
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    error={!!errors.shippingCostEUR}
                    helperText={errors.shippingCostEUR?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    {...register('customsCostEUR', { valueAsNumber: true })}
                    label={tShipments('customsCost')}
                    fullWidth
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    error={!!errors.customsCostEUR}
                    helperText={errors.customsCostEUR?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    {...register('packagingCostEUR', { valueAsNumber: true })}
                    label={tShipments('packagingCost')}
                    fullWidth
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    error={!!errors.packagingCostEUR}
                    helperText={errors.packagingCostEUR?.message}
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
    </LocalizationProvider>
  );
}
