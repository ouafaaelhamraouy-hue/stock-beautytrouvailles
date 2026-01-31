'use client';

import { Box, TextField, MenuItem, Chip, IconButton, Paper, Button, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ClearIcon from '@mui/icons-material/Clear';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

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
  totalCount: number;
  visibleCount: number;
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
  totalCount,
  visibleCount,
}: FilterCommandBarProps) {
  const hasActiveFilters = search || category || source || stock;
  const activeFilterCount = [search, category, source, stock].filter(Boolean).length;

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        position: 'sticky',
        top: { xs: 56, sm: 64 },
        zIndex: 10,
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(0, 0, 0, 0.08)',
        backgroundColor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.65)
          : alpha(theme.palette.common.white, 0.7),
        boxShadow: theme.palette.mode === 'dark'
          ? '0 16px 40px rgba(0, 0, 0, 0.28)'
          : '0 16px 40px rgba(15, 23, 42, 0.08)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      })}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={(theme) => ({
            minWidth: 220,
            flex: 1,
            maxWidth: 360,
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.9)
                : alpha(theme.palette.common.white, 0.7),
              borderRadius: 2,
            },
          })}
          InputProps={{
            endAdornment: search ? (
              <IconButton
                size="small"
                onClick={() => onSearchChange('')}
                sx={{ mr: -0.5 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : undefined,
          }}
        />

        {/* Category */}
        <TextField
          select
          size="small"
          label="Category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          sx={(theme) => ({
            minWidth: 160,
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.9)
                : alpha(theme.palette.common.white, 0.7),
              borderRadius: 2,
            },
          })}
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
          sx={(theme) => ({
            minWidth: 150,
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.9)
                : alpha(theme.palette.common.white, 0.7),
              borderRadius: 2,
            },
          })}
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
          onChange={(e) => onStockChange(e.target.value as 'low' | 'out' | 'ok' | '')}
          sx={(theme) => ({
            minWidth: 140,
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.9)
                : alpha(theme.palette.common.white, 0.7),
              borderRadius: 2,
            },
          })}
        >
          <MenuItem value="">All Stock</MenuItem>
          {Object.entries(STOCK_LABELS).map(([key, label]) => (
            <MenuItem key={key} value={key}>
              {label}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Clear all filters">
            <Button
              size="small"
              variant="outlined"
              startIcon={<RestartAltIcon fontSize="small" />}
              onClick={onReset}
              disabled={!hasActiveFilters}
              sx={(theme) => ({
                borderColor: alpha(theme.palette.text.primary, 0.2),
                color: 'text.primary',
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.7)
                  : alpha(theme.palette.common.white, 0.5),
                '&:hover': {
                  borderColor: alpha(theme.palette.text.primary, 0.35),
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.9)
                    : alpha(theme.palette.common.white, 0.7),
                },
              })}
            >
              Reset
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            label={
              hasActiveFilters
                ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} active`
                : 'No filters applied'
            }
            size="small"
            variant="outlined"
          />
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
        </Box>

        <Chip
          label={`Showing ${visibleCount} of ${totalCount}`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Box>
    </Paper>
  );
}
