'use client';

import { useEffect } from 'react';
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
import { brandSchema, type BrandFormData } from '@/lib/validations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface BrandFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BrandFormData) => Promise<void>;
  initialData?: {
    id: string;
    name: string;
    country?: string | null;
    logoUrl?: string | null;
  };
  loading?: boolean;
}

export function BrandForm({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: BrandFormProps) {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: initialData || {
      name: '',
      country: 'France',
      logoUrl: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        country: initialData.country || 'France',
        logoUrl: initialData.logoUrl || '',
      });
    } else {
      reset({
        name: '',
        country: 'France',
        logoUrl: '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: BrandFormData) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save brand');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{initialData ? `Edit ${tNav('brands')}` : `Create ${tNav('brands')}`}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              {...register('name')}
              label="Brand Name"
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name?.message}
              autoFocus
            />
            <TextField
              {...register('country')}
              label="Country"
              fullWidth
              error={!!errors.country}
              helperText={errors.country?.message}
              placeholder="France"
            />
            <TextField
              {...register('logoUrl')}
              label="Logo URL (optional)"
              fullWidth
              type="url"
              error={!!errors.logoUrl}
              helperText={errors.logoUrl?.message || 'URL to brand logo image'}
              placeholder="https://example.com/logo.png"
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
