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
  Box,
} from '@mui/material';
import { supplierSchema, type SupplierFormData } from '@/lib/validations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface SupplierFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  initialData?: {
    id: string;
    name: string;
    contactInfo?: string | null;
  };
  loading?: boolean;
}

export function SupplierForm({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: SupplierFormProps) {
  const t = useTranslations('common');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialData || {
      name: '',
      contactInfo: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: '',
        contactInfo: '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: SupplierFormData) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save supplier');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{initialData ? 'Edit Supplier' : 'Create Supplier'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              {...register('name')}
              label="Supplier Name"
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name?.message}
              autoFocus
            />
            <TextField
              {...register('contactInfo')}
              label="Contact Information"
              fullWidth
              multiline
              rows={3}
              error={!!errors.contactInfo}
              helperText={errors.contactInfo?.message}
              placeholder="Email, phone, address, etc."
            />
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
