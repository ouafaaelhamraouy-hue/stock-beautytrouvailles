'use client';

import {
  Box,
  TextField,
  MenuItem,
  Paper,
  Typography,
} from '@mui/material';
import { SearchInput } from '@/components/ui';

interface Category {
  id: string;
  name: string;
  nameFr?: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Arrivage {
  id: string;
  reference: string;
}

interface InventoryFiltersProps {
  arrivages: Arrivage[];
  categories: Category[];
  brands: Brand[];
  selectedArrivageId: string | null;
  selectedCategoryId: string | null;
  selectedBrandId: string | null;
  search: string;
  onArrivageChange: (arrivageId: string | null) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onBrandChange: (brandId: string | null) => void;
  onSearchChange: (search: string) => void;
}

export function InventoryFilters({
  arrivages,
  categories,
  brands,
  selectedArrivageId,
  selectedCategoryId,
  selectedBrandId,
  search,
  onArrivageChange,
  onCategoryChange,
  onBrandChange,
  onSearchChange,
}: InventoryFiltersProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Filters
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          select
          label="Arrivage"
          value={selectedArrivageId || ''}
          onChange={(e) => onArrivageChange(e.target.value || null)}
          sx={{ minWidth: 200 }}
          size="small"
        >
          <MenuItem value="">Tous</MenuItem>
          {arrivages.map((arrivage) => (
            <MenuItem key={arrivage.id} value={arrivage.id}>
              {arrivage.reference}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Catégorie"
          value={selectedCategoryId || ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          sx={{ minWidth: 200 }}
          size="small"
        >
          <MenuItem value="">Toutes</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.nameFr || category.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Marque"
          value={selectedBrandId || ''}
          onChange={(e) => onBrandChange(e.target.value || null)}
          sx={{ minWidth: 200 }}
          size="small"
        >
          <MenuItem value="">Toutes</MenuItem>
          {brands.map((brand) => (
            <MenuItem key={brand.id} value={brand.id}>
              {brand.name}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ flex: 1, minWidth: 200 }}>
          <SearchInput
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un produit..."
          />
        </Box>
      </Box>
    </Paper>
  );
}
