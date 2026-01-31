'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
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
  onSubmit: (data: ShipmentFormData) => Promise<void>;
  initialData?: {
    id: string;
    reference: string;
    source: ShipmentFormData['source'];
    purchaseDate?: string | Date | null;
    shipDate?: string | Date | null;
    receivedDate?: string | Date | null;
    status: ShipmentFormData['status'];
    exchangeRate: number;
    shippingCostEUR: number;
    packagingCostEUR: number;
    totalCostEUR: number;
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
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);
  const [shipDate, setShipDate] = useState<Date | null>(null);
  const [receivedDate, setReceivedDate] = useState<Date | null>(null);
  const toDate = (value?: string | Date | null) =>
    value ? (value instanceof Date ? value : new Date(value)) : undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      reference: initialData?.reference ?? '',
      source: initialData?.source ?? 'OTHER',
      purchaseDate: toDate(initialData?.purchaseDate),
      shipDate: toDate(initialData?.shipDate),
      receivedDate: toDate(initialData?.receivedDate),
      status: initialData?.status ?? 'PENDING',
      exchangeRate: initialData?.exchangeRate ?? 10.85,
      totalCostEUR: initialData?.totalCostEUR ?? 0,
    },
  });

  useEffect(() => {
    reset({
      reference: initialData?.reference ?? '',
      source: initialData?.source ?? 'OTHER',
      purchaseDate: toDate(initialData?.purchaseDate),
      shipDate: toDate(initialData?.shipDate),
      receivedDate: toDate(initialData?.receivedDate),
      status: initialData?.status ?? 'PENDING',
      exchangeRate: initialData?.exchangeRate ?? 10.85,
      totalCostEUR: initialData?.totalCostEUR ?? 0,
    });
    setPurchaseDate(toDate(initialData?.purchaseDate) ?? null);
    setShipDate(toDate(initialData?.shipDate) ?? null);
    setReceivedDate(toDate(initialData?.receivedDate) ?? null);
  }, [initialData, reset]);

  const statusValue = watch('status') ?? 'PENDING';
  const sourceValue = watch('source') ?? 'OTHER';
  const exchangeRateValue = watch('exchangeRate') ?? 0;
  const totalCostEURValue = watch('totalCostEUR') ?? 0;

  const handleFormSubmit: SubmitHandler<ShipmentFormData> = async (data) => {
    try {
      const submitData = {
        ...data,
        purchaseDate: purchaseDate ?? undefined,
        shipDate: shipDate ?? undefined,
        receivedDate: receivedDate ?? undefined,
        shippingCostEUR: 0,
        packagingCostEUR: 0,
      };
      await onSubmit(submitData);
      reset();
      setPurchaseDate(null);
      setShipDate(null);
      setReceivedDate(null);
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
                    value={sourceValue}
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
                    label={tShipments('purchaseDate')}
                    value={purchaseDate}
                    onChange={(newValue) => setPurchaseDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.purchaseDate,
                        helperText: errors.purchaseDate?.message,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label={tShipments('shipDate')}
                    value={shipDate}
                    onChange={(newValue) => setShipDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.shipDate,
                        helperText: errors.shipDate?.message,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label={tShipments('receivedDate')}
                    value={receivedDate}
                    onChange={(newValue) => setReceivedDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.receivedDate,
                        helperText: errors.receivedDate?.message,
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
                    value={statusValue}
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="PURCHASED">Purchased</MenuItem>
                    <MenuItem value="SHIPPED">Shipped</MenuItem>
                    <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
                    <MenuItem value="CUSTOMS">Customs</MenuItem>
                    <MenuItem value="RECEIVED">Received</MenuItem>
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('totalCostEUR', { valueAsNumber: true })}
                    label={`${tShipments('totalCost')} (EUR)`}
                    fullWidth
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    error={!!errors.totalCostEUR}
                    helperText={
                      errors.totalCostEUR?.message
                        ?? 'Auto-calculated from items + expenses'
                    }
                    InputProps={{ readOnly: true }}
                    value={totalCostEURValue}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={`${tShipments('totalCost')} (DH)`}
                    fullWidth
                    value={(totalCostEURValue * exchangeRateValue).toFixed(2)}
                    InputProps={{ readOnly: true }}
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
