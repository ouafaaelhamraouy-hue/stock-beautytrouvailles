'use client';

import {
  Box,
  Typography,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StoreIcon from '@mui/icons-material/Store';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { CurrencyDisplay } from '@/components/ui';
import { PurchaseSource } from '@prisma/client';

interface ShipmentHeaderProps {
  reference: string;
  shipDate: string | null;
  source: PurchaseSource;
  totalProducts: number;
  totalValue: number;
}

const sourceLabels: Record<PurchaseSource, string> = {
  ACTION: 'ACTION',
  RITUALS: 'RITUALS',
  NOCIBE: 'NOCIBE',
  LIDL: 'LIDL',
  CARREFOUR: 'CARREFOUR',
  PHARMACIE: 'PHARMACIE',
  AMAZON_FR: 'AMAZON FR',
  SEPHORA: 'SEPHORA',
  OTHER: 'Autre',
};

export function ShipmentHeader({
  reference,
  shipDate,
  source,
  totalProducts,
  totalValue,
}: ShipmentHeaderProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalShippingIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {reference}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', ml: 'auto' }}>
        {shipDate && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {formatDate(shipDate)}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <StoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {sourceLabels[source]}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <InventoryIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {totalProducts} produits
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AttachMoneyIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <CurrencyDisplay amount={totalValue || 0} currency="DH" variant="body2" />
        </Box>
      </Box>
    </Box>
  );
}
