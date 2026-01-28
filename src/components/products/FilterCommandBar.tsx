'use client';

import { Box, TextField, MenuItem, Chip, IconButton, Paper } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

interface FilterCommandBarProps {
  search: string;
  category: string;
  source: string;
  stock: 'low' | 'out' | 'ok' | '';
  categories: Array<{ id: string; name: string }>;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onStockChange: (value: 'low' | 'out' | 'ok' | '') => void;
  onReset: () => void;
}

const PURCHASE_SOURCE_LABELS: Record<string, string> = {
  ACTION: 'Action',
  RITUALS: 'Rituals',
  NOCIBE: 'Nocibé',
  LIDL: 'Lidl',
  CARREFOUR: 'Carrefour',
  PHARMACIE: 'Pharmacie',
  AMAZON_FR: 'Amazon FR',
  SEPHORA: 'Sephora',
  OTHER: 'Other',
};

const STOCK_LABELS: Record<string, string> = {
  ok: 'OK',
  low: 'Low Stock',
  out: 'Out of Stock',
};

export function FilterCommandBar({
  search,
  category,
  source,
  stock,
  categories,
  onSearchChange,
  onCategoryChange,
  onSourceChange,
  onStockChange,
  onReset,
}: FilterCommandBarProps) {
  const hasActiveFilters = search || category || source || stock;

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        position: 'sticky',
        top: { xs: 56, sm: 64 },
        zIndex: 10,
        p: 2,
        borderRadius: 0,
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.08)',
        backgroundColor: theme.palette.mode === 'dark'
          ? theme.palette.background.paper
          : '#FFFFFF',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 2px 8px rgba(0, 0, 0, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
      })}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 200, flex: 1, maxWidth: 300 }}
        />

        {/* Category */}
        <TextField
          select
          size="small"
          label="Category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Source */}
        <TextField
          select
          size="small"
          label="Source"
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All Sources</MenuItem>
          {Object.entries(PURCHASE_SOURCE_LABELS).map(([key, label]) => (
            <MenuItem key={key} value={key}>
              {label}
            </MenuItem>
          ))}
        </TextField>

        {/* Stock Status */}
        <TextField
          select
          size="small"
          label="Stock"
          value={stock}
          onChange={(e) => onStockChange(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All Stock</MenuItem>
          {Object.entries(STOCK_LABELS).map(([key, label]) => (
            <MenuItem key={key} value={key}>
              {label}
            </MenuItem>
          ))}
        </TextField>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', ml: 'auto' }}>
            {search && (
              <Chip
                label={`Search: ${search}`}
                size="small"
                onDelete={() => onSearchChange('')}
                deleteIcon={<ClearIcon />}
              />
            )}
            {category && (
              <Chip
                label={`Category: ${categories.find(c => c.id === category)?.name || category}`}
                size="small"
                onDelete={() => onCategoryChange('')}
                deleteIcon={<ClearIcon />}
              />
            )}
            {source && (
              <Chip
                label={`Source: ${PURCHASE_SOURCE_LABELS[source] || source}`}
                size="small"
                onDelete={() => onSourceChange('')}
                deleteIcon={<ClearIcon />}
              />
            )}
            {stock && (
              <Chip
                label={`Stock: ${STOCK_LABELS[stock] || stock}`}
                size="small"
                onDelete={() => onStockChange('')}
                deleteIcon={<ClearIcon />}
              />
            )}
            <IconButton
              size="small"
              onClick={onReset}
              sx={{
                ml: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
