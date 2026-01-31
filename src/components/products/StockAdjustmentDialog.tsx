'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';

const adjustStockSchema = z.object({
  delta: z.number().int().refine((val) => val !== 0, {
    message: 'Delta must be non-zero',
  }),
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason must be less than 200 characters'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional().nullable(),
});

type AdjustStockFormData = z.infer<typeof adjustStockSchema>;

interface StockAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentStock: number;
  onSuccess: () => void;
}

export function StockAdjustmentDialog({
  open,
  onClose,
  productId,
  productName,
  currentStock,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const t = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [deltaType, setDeltaType] = useState<'increase' | 'decrease'>('increase');
  const [deltaValue, setDeltaValue] = useState<number>(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AdjustStockFormData>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      delta: 1,
      reason: '',
      notes: '',
    },
  });

  const reason = watch('reason');

  const handleDeltaTypeChange = (type: 'increase' | 'decrease') => {
    setDeltaType(type);
    const newDelta = type === 'increase' ? Math.abs(deltaValue) : -Math.abs(deltaValue);
    setValue('delta', newDelta, { shouldValidate: true });
  };

  const handleDeltaValueChange = (value: number) => {
    const absValue = Math.abs(value);
    setDeltaValue(absValue);
    const newDelta = deltaType === 'increase' ? absValue : -absValue;
    setValue('delta', newDelta, { shouldValidate: true });
  };

  const onSubmit = async (data: AdjustStockFormData) => {
    const signedDelta = deltaType === 'increase' ? deltaValue : -deltaValue;
    const payload: AdjustStockFormData = {
      ...data,
      delta: signedDelta,
    };
    // Calculate new stock
    const newStock = currentStock + signedDelta;

    // Rule: Never allow stock to go below zero
    if (newStock < 0) {
      toast.error(`Cannot adjust stock below zero. Current stock: ${currentStock}, Delta: ${signedDelta}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to adjust stock');
      }

      toast.success('Stock adjusted successfully');
      reset();
      setDeltaType('increase');
      setDeltaValue(1);
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setDeltaType('increase');
      setDeltaValue(1);
      onClose();
    }
  };

  const newStock = currentStock + (deltaType === 'increase' ? deltaValue : -deltaValue);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Adjust Stock - {productName}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Current Stock Display */}
            <Box
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                backgroundColor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Current Stock
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {currentStock}
              </Typography>
            </Box>

            {/* Delta Type Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'text.primary' }}>
                Adjustment Type
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={deltaType === 'increase' ? 'contained' : 'outlined'}
                  onClick={() => handleDeltaTypeChange('increase')}
                  sx={{ flex: 1 }}
                >
                  Increase (+)
                </Button>
                <Button
                  variant={deltaType === 'decrease' ? 'contained' : 'outlined'}
                  onClick={() => handleDeltaTypeChange('decrease')}
                  color={deltaType === 'decrease' ? 'error' : 'primary'}
                  sx={{ flex: 1 }}
                >
                  Decrease (-)
                </Button>
              </Box>
            </Box>

            {/* Delta Value */}
            <Box sx={{ mb: 2 }}>
              <TextField
                {...register('delta', { valueAsNumber: true })}
                label="Quantity"
                type="number"
                fullWidth
                required
                value={deltaValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  handleDeltaValueChange(val);
                }}
                inputProps={{
                  min: 1,
                  step: 1,
                }}
                error={!!errors.delta}
                helperText={errors.delta?.message}
              />
            </Box>

            {/* New Stock Preview */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                New Stock After Adjustment
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: newStock < 0 ? 'error.main' : 'text.primary',
                }}
              >
                {newStock}
                {newStock < 0 && (
                  <Typography component="span" variant="caption" sx={{ ml: 1, color: 'error.main' }}>
                    (Cannot go below zero)
                  </Typography>
                )}
              </Typography>
            </Box>

            {/* Reason (Required) */}
            <Box sx={{ mb: 2 }}>
              <TextField
                {...register('reason')}
                label="Reason *"
                fullWidth
                required
                multiline
                rows={2}
                error={!!errors.reason}
                helperText={errors.reason?.message || 'Required: Explain why this adjustment is needed'}
                placeholder="e.g., Damaged items, Found inventory, Count correction..."
              />
            </Box>

            {/* Notes (Optional) */}
            <Box sx={{ mb: 2 }}>
              <TextField
                {...register('notes')}
                label="Additional Notes (Optional)"
                fullWidth
                multiline
                rows={2}
                error={!!errors.notes}
                helperText={errors.notes?.message}
                placeholder="Additional details about this adjustment..."
              />
            </Box>

            {/* Warning if stock would go negative */}
            {newStock < 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Cannot adjust stock below zero. Current: {currentStock}, Adjustment: {deltaType === 'increase' ? '+' : '-'}{deltaValue}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || newStock < 0 || !reason || reason.trim().length === 0}
          >
            {loading ? t('loading') : 'Apply Adjustment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
