'use client';

import { Typography } from '@mui/material';
import { formatCurrency } from '@/lib/format';
import { useLocale } from 'next-intl';

interface CurrencyDisplayProps {
  amount: number;
  currency: 'EUR' | 'DH';
  variant?: 'body1' | 'body2' | 'h6' | 'h5' | 'h4' | 'h3' | 'h2' | 'h1';
  color?: string;
}

export function CurrencyDisplay({
  amount,
  currency,
  variant = 'body1',
  color,
}: CurrencyDisplayProps) {
  const locale = useLocale() as 'en' | 'fr';
  const formatted = formatCurrency(amount, currency, locale);

  return (
    <Typography variant={variant} sx={{ color, fontWeight: 'medium' }}>
      {formatted}
    </Typography>
  );
}
