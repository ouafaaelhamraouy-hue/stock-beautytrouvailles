'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { toast } from 'sonner';

interface ResetStockDialogProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentStock: number;
  currentSold: number;
  onSuccess: () => void;
}

export function ResetStockDialog({
  open,
  onClose,
  productId,
  productName,
  currentStock,
  currentSold,
  onSuccess,
}: ResetStockDialogProps) {
  const [loading, setLoading] = useState(false);
  const [newStock, setNewStock] = useState<number>(currentStock);
  const [resetSold, setResetSold] = useState(true);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleClose = () => {
    if (loading) return;
    setNewStock(currentStock);
    setResetSold(true);
    setReason('');
    setNotes('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    if (newStock < 0) {
      toast.error('Stock cannot be negative');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/reset-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStock,
          resetSold,
          reason: reason.trim(),
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset stock');
      }

      toast.success('Stock reset successfully');
      onSuccess();
      handleClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reset Stock - {productName}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Current Stock: {currentStock} | Sold: {currentSold}
            </Typography>
          </Box>

          <TextField
            label="New Stock (on hand)"
            type="number"
            fullWidth
            value={newStock}
            onChange={(e) => setNewStock(Number(e.target.value))}
            inputProps={{ min: 0, step: 1 }}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={resetSold}
                onChange={(e) => setResetSold(e.target.checked)}
              />
            }
            label="Reset sold to 0 (sales are tracked only in Sales page)"
          />

          <TextField
            label="Reason *"
            fullWidth
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Notes (optional)"
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Reset'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
