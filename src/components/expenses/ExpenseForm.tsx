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
import { expenseSchema, type ExpenseFormData } from '@/lib/validations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface Shipment {
  id: string;
  reference: string;
  supplier: {
    name: string;
  };
}

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: {
    id: string;
    date: string;
    amountEUR: number;
    amountDH: number;
    description: string;
    type: string;
    shipmentId?: string | null;
  };
  shipments: Shipment[];
  exchangeRate?: number;
  loading?: boolean;
}

export function ExpenseForm({
  open,
  onClose,
  onSubmit,
  initialData,
  shipments,
  exchangeRate = 10.5,
  loading = false,
}: ExpenseFormProps) {
  const t = useTranslations('common');
  const tExpenses = useTranslations('expenses');
  const [expenseDate, setExpenseDate] = useState<Date | null>(new Date());
  const [amountEUR, setAmountEUR] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ExpenseFormData & { shipmentId?: string }>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialData || {
      date: new Date(),
      amountEUR: 0,
      amountDH: 0,
      description: '',
      type: 'OPERATIONAL',
      shipmentId: undefined,
    },
  });

  const amountEURValue = watch('amountEUR');

  // Auto-calculate DH when EUR changes
  useEffect(() => {
    if (amountEURValue && amountEURValue > 0) {
      const dh = amountEURValue * exchangeRate;
      setValue('amountDH', dh, { shouldValidate: true });
      setAmountEUR(amountEURValue);
    }
  }, [amountEURValue, setValue, exchangeRate]);

  useEffect(() => {
    if (initialData) {
      reset({
        date: new Date(initialData.date),
        amountEUR: initialData.amountEUR,
        amountDH: initialData.amountDH,
        description: initialData.description,
        type: initialData.type as any,
        shipmentId: initialData.shipmentId || undefined,
      });
      setExpenseDate(new Date(initialData.date));
      setAmountEUR(initialData.amountEUR);
    } else {
      reset({
        date: new Date(),
        amountEUR: 0,
        amountDH: 0,
        description: '',
        type: 'OPERATIONAL',
        shipmentId: undefined,
      });
      setExpenseDate(new Date());
      setAmountEUR(0);
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: any) => {
    try {
      const submitData = {
        ...data,
        date: expenseDate?.toISOString() || new Date().toISOString(),
      };
      await onSubmit(submitData);
      reset();
      setExpenseDate(new Date());
      setAmountEUR(0);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save expense');
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
                  >
                    <MenuItem value="OPERATIONAL">{tExpenses('operational')}</MenuItem>
                    <MenuItem value="MARKETING">{tExpenses('marketing')}</MenuItem>
                    <MenuItem value="UTILITIES">{tExpenses('utilities')}</MenuItem>
                    <MenuItem value="OTHER">{tExpenses('other')}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('amountEUR', { valueAsNumber: true })}
                    label={`${tExpenses('amount')} (EUR)`}
                    fullWidth
                    required
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    error={!!errors.amountEUR}
                    helperText={errors.amountEUR?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('amountDH', { valueAsNumber: true })}
                    label={`${tExpenses('amount')} (DH)`}
                    fullWidth
                    required
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    error={!!errors.amountDH}
                    helperText={errors.amountDH?.message || `Auto-calculated: ${expenseEUR * exchangeRate} DH`}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    {...register('description')}
                    label={tExpenses('description')}
                    fullWidth
                    required
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                </Grid>
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
                    {shipments.map((shipment) => (
                      <MenuItem key={shipment.id} value={shipment.id}>
                        {shipment.reference} - {shipment.supplier.name}
                      </MenuItem>
                    ))}
                  </TextField>
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
