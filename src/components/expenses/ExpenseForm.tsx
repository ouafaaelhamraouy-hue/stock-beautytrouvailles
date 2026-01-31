'use client';

import { useState, useEffect, useRef } from 'react';
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
import { expenseSchema, type ExpenseFormData } from '@/lib/validations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface Arrivage {
  id: string;
  reference: string;
  supplier?: {
    name: string;
  };
}

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData & { shipmentId?: string }) => Promise<void>;
  initialData?: {
    id: string;
    date: string | Date;
    amountEUR: number | { toNumber: () => number };
    amountDH: number | { toNumber: () => number };
    description: string;
    type: string;
    shipmentId?: string | null;
    arrivageId?: string | null;
  };
  shipments: Arrivage[];
  exchangeRate?: number;
  defaultShipmentId?: string;
  hideShipmentSelect?: boolean;
  loading?: boolean;
}

export function ExpenseForm({
  open,
  onClose,
  onSubmit,
  initialData,
  shipments,
  exchangeRate = 10.5,
  defaultShipmentId,
  hideShipmentSelect = false,
  loading = false,
}: ExpenseFormProps) {
  const t = useTranslations('common');
  const tExpenses = useTranslations('expenses');
  const [expenseDate, setExpenseDate] = useState<Date | null>(new Date());
  const toNumber = (value: number | { toNumber?: () => number }) =>
    typeof value === 'number'
      ? value
      : typeof value?.toNumber === 'function'
        ? value.toNumber()
        : Number(value);
  const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ExpenseFormData & { shipmentId?: string }>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialData ? {
      date: toDate(initialData.date),
      amountEUR: toNumber(initialData.amountEUR),
      amountDH: toNumber(initialData.amountDH),
      description: initialData.description,
      type: initialData.type as 'OPERATIONAL' | 'MARKETING' | 'UTILITIES' | 'PACKAGING' | 'SHIPPING' | 'ADS' | 'OTHER',
      shipmentId: initialData.shipmentId || initialData.arrivageId || undefined,
    } : {
      date: new Date(),
      amountEUR: 0,
      amountDH: 0,
      description: '',
      type: 'OPERATIONAL',
      shipmentId: defaultShipmentId ?? undefined,
    },
  });

  const amountEURValue = watch('amountEUR');
  const amountDHValue = watch('amountDH');
  const typeValue = watch('type') ?? 'OPERATIONAL';
  const lastEdited = useRef<'EUR' | 'DH' | null>(null);
  const amountEURRegister = register('amountEUR', { valueAsNumber: true });
  const amountDHRegister = register('amountDH', { valueAsNumber: true });
  const round2 = (value: number) => Math.round(value * 100) / 100;

  // Auto-calculate DH when EUR changes
  useEffect(() => {
    if (lastEdited.current !== 'EUR') return;
    const eur = Number(amountEURValue) || 0;
    const dh = round2(eur * exchangeRate);
    setValue('amountDH', dh, { shouldValidate: true });
  }, [amountEURValue, setValue, exchangeRate]);

  // Auto-calculate EUR when DH changes
  useEffect(() => {
    if (lastEdited.current !== 'DH') return;
    const dh = Number(amountDHValue) || 0;
    const eur = exchangeRate ? round2(dh / exchangeRate) : 0;
    setValue('amountEUR', eur, { shouldValidate: true });
  }, [amountDHValue, setValue, exchangeRate]);

  useEffect(() => {
    if (initialData) {
      reset({
        date: toDate(initialData.date),
        amountEUR: toNumber(initialData.amountEUR),
        amountDH: toNumber(initialData.amountDH),
        description: initialData.description,
        type: initialData.type as ExpenseFormData['type'],
        shipmentId: initialData.shipmentId || initialData.arrivageId || undefined,
      });
      setExpenseDate(toDate(initialData.date));
    } else {
      reset({
        date: new Date(),
        amountEUR: 0,
        amountDH: 0,
        description: '',
        type: 'OPERATIONAL',
        shipmentId: defaultShipmentId ?? undefined,
      });
      setExpenseDate(new Date());
    }
  }, [initialData, reset, defaultShipmentId]);

  useEffect(() => {
    if (!initialData && defaultShipmentId) {
      setValue('shipmentId', defaultShipmentId, { shouldValidate: true });
    }
  }, [defaultShipmentId, initialData, setValue]);

  const handleFormSubmit: SubmitHandler<ExpenseFormData & { shipmentId?: string }> = async (data) => {
    try {
      const rawEur = Number(data.amountEUR) || 0;
      const rawDh = Number(data.amountDH) || 0;
      const eur = rawEur > 0 ? rawEur : (exchangeRate ? round2(rawDh / exchangeRate) : 0);
      const dh = rawDh > 0 ? rawDh : round2(eur * exchangeRate);
      const submitData = {
        ...data,
        date: expenseDate ?? new Date(),
        amountEUR: eur,
        amountDH: dh,
        description: data.description ? data.description : undefined,
      };
      await onSubmit(submitData);
      reset();
      setExpenseDate(new Date());
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save expense');
      console.error(error);
    }
  };


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogTitle>{initialData ? tExpenses('edit') : tExpenses('create')}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label={tExpenses('date')}
                    value={expenseDate}
                    onChange={(newValue) => setExpenseDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.date,
                        helperText: errors.date?.message,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('type')}
                    label={tExpenses('type')}
                    fullWidth
                    required
                    select
                    error={!!errors.type}
                    helperText={errors.type?.message}
                    value={typeValue}
                  >
                    <MenuItem value="OPERATIONAL">{tExpenses('operational')}</MenuItem>
                    <MenuItem value="MARKETING">{tExpenses('marketing')}</MenuItem>
                    <MenuItem value="UTILITIES">{tExpenses('utilities')}</MenuItem>
                    <MenuItem value="PACKAGING">{tExpenses('packaging')}</MenuItem>
                    <MenuItem value="SHIPPING">{tExpenses('shipping')}</MenuItem>
                    <MenuItem value="ADS">{tExpenses('ads')}</MenuItem>
                    <MenuItem value="OTHER">{tExpenses('other')}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...amountEURRegister}
                    label={`${tExpenses('amount')} (EUR)`}
                    fullWidth
                    required
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    error={!!errors.amountEUR}
                    helperText={errors.amountEUR?.message}
                    onChange={(event) => {
                      lastEdited.current = 'EUR';
                      amountEURRegister.onChange(event);
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...amountDHRegister}
                    label={`${tExpenses('amount')} (DH)`}
                    fullWidth
                    required
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    error={!!errors.amountDH}
                    helperText={errors.amountDH?.message || (amountEURValue ? `Auto-calculated: ${(amountEURValue * exchangeRate).toFixed(2)} DH` : '')}
                    onChange={(event) => {
                      lastEdited.current = 'DH';
                      amountDHRegister.onChange(event);
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    {...register('description')}
                    label={tExpenses('description')}
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                </Grid>
                {!hideShipmentSelect && (
                  <Grid item xs={12}>
                    <TextField
                      {...register('shipmentId')}
                      label={`${tExpenses('shipment')} (${tExpenses('optional')})`}
                      fullWidth
                      select
                      error={!!errors.shipmentId}
                      helperText={errors.shipmentId?.message}
                    >
                      <MenuItem value="">{tExpenses('optional')}</MenuItem>
                      {shipments.map((arrivage) => (
                        <MenuItem key={arrivage.id} value={arrivage.id}>
                          {arrivage.reference} {arrivage.supplier?.name ? `- ${arrivage.supplier.name}` : ''}
                        </MenuItem>
                      ))}
                    </TextField>
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
    </LocalizationProvider>
  );
}
