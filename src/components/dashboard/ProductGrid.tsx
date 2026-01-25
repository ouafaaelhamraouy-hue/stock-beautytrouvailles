'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridCellEditStopParams,
  GridActionsCellItem,
  GridToolbar,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Box, Chip, IconButton, Tooltip, Skeleton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProducts, useUpdateProduct, useBulkUpdateProducts, Product } from '@/hooks/useProducts';
import { getMarginColor } from '@/lib/calculations';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const PURCHASE_SOURCE_LABELS: Record<string, string> = {
  ACTION: 'Action',
  RITUALS: 'Rituals',
  NOCIBE: 'Nocibé',
  LIDL: 'Lidl',
  CARREFOUR: 'Carrefour',
  PHARMACIE: 'Pharmacie',
  AMAZON_FR: 'Amazon FR',
  SEPHORA: 'Sephora',
  OTHER: 'Autre',
};

interface ProductGridProps {
  categoryId?: string;
  search?: string;
  source?: string;
  stockFilter?: 'low' | 'out' | 'ok';
  onProductClick?: (product: Product) => void;
}

export const ProductGrid = memo(function ProductGrid({
  categoryId,
  search,
  source,
  stockFilter,
  onProductClick,
}: ProductGridProps) {
  const t = useTranslations('common');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useProducts({
    page: page + 1,
    limit: pageSize,
    categoryId,
    search,
    source,
    stock: stockFilter,
  });

  const updateProduct = useUpdateProduct();
  const bulkUpdate = useBulkUpdateProducts();

  const handleCellEditStop = useCallback(
    async (params: GridCellEditStopParams) => {
      const { id, field, value } = params;
      const product = data?.products.find((p: Product) => p.id === id);

      if (!product) return;

      // Only update if value changed
      if (product[field as keyof Product] === value) return;

      try {
        await updateProduct.mutateAsync({
          id: id as string,
          [field]: value,
        });
        toast.success('Product updated successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to update product');
        // Refetch to restore original value
        refetch();
      }
    },
    [data, updateProduct, refetch]
  );

  const handleBulkEdit = useCallback(async () => {
    if (selectedRows.length === 0) return;

    // Example: Bulk update selling price
    // You can extend this to show a dialog for bulk edits
    toast.info('Bulk edit feature coming soon');
  }, [selectedRows]);

  const columns: GridColDef<Product>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Produit',
        width: 250,
        editable: true,
        flex: 1,
      },
      {
        field: 'purchasePriceEur',
        headerName: 'PA (EUR)',
        width: 100,
        editable: true,
        type: 'number',
        valueFormatter: (value: number | null) => value ? `${value?.toFixed(2) || 0} €` : '-',
      },
      {
        field: 'purchasePriceMad',
        headerName: 'PA (MAD)',
        width: 110,
        editable: true,
        type: 'number',
        valueFormatter: (value: number) => `${value?.toFixed(2) || 0} DH`,
      },
      {
        field: 'sellingPriceDh',
        headerName: 'PV',
        width: 100,
        editable: true,
        type: 'number',
        valueFormatter: (value: number) => `${value?.toFixed(2) || 0} DH`,
      },
      {
        field: 'promoPriceDh',
        headerName: 'Promo',
        width: 100,
        editable: true,
        type: 'number',
        valueFormatter: (value: number | null) => value ? `${value.toFixed(2)} DH` : '-',
      },
      {
        field: 'currentStock',
        headerName: 'Stock',
        width: 80,
        type: 'number',
        cellClassName: (params) => {
          const stock = params.value as number;
          if (stock === 0) return 'stock-out';
          const product = params.row;
          if (stock <= product.reorderLevel) return 'stock-low';
          return '';
        },
        renderCell: (params) => {
          const stock = params.value as number;
          const product = params.row;
          const isLow = stock <= product.reorderLevel;
          const isOut = stock === 0;

          return (
            <Box
              sx={{
                fontWeight: isLow ? 600 : 400,
                color: isOut ? 'error.main' : isLow ? 'warning.main' : 'text.primary',
              }}
            >
              {stock}
            </Box>
          );
        },
      },
      {
        field: 'quantitySold',
        headerName: 'Vendu',
        width: 80,
        editable: true,
        type: 'number',
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', height: 600 }}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <p>Error loading products: {error.message}</p>
      </Box>
    );
  }

  return (
    <Box 
      sx={(theme) => ({ 
        height: 600, 
        width: '100%',
        '& .MuiDataGrid-root': {
          border: 'none',
          backgroundColor: 'background.paper',
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : '#F9FAFB',
          borderBottom: `2px solid ${theme.palette.divider}`,
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'text.secondary',
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
          },
        },
        '& .MuiDataGrid-row': {
          transition: 'background-color 0.2s ease',
          '&:nth-of-type(even)': {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.03)'
              : '#F9FAFB',
          },
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08) !important'
              : '#F3F4F6 !important',
            cursor: 'pointer',
          },
          '&.Mui-selected': {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(212, 20, 90, 0.2) !important'
              : 'rgba(212, 20, 90, 0.08) !important',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(212, 20, 90, 0.25) !important'
                : 'rgba(212, 20, 90, 0.12) !important',
            },
          },
        },
        '& .MuiDataGrid-cell': {
          borderBottom: `1px solid ${theme.palette.divider}`,
          '&:focus': {
            outline: 'none',
          },
          '&:focus-within': {
            outline: 'none',
          },
        },
        '& .stock-out': {
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(239, 68, 68, 0.2) !important'
            : 'rgba(239, 68, 68, 0.1) !important',
        },
        '& .stock-low': {
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(245, 158, 11, 0.2) !important'
            : 'rgba(245, 158, 11, 0.1) !important',
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: `2px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : '#F9FAFB',
        },
        '& .MuiDataGrid-toolbarContainer': {
          padding: '12px 16px',
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : '#F9FAFB',
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
      })}
    >
      <DataGrid
        rows={data?.products || []}
        columns={columns}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        rowCount={data?.pagination.total || 0}
        onPaginationModelChange={(model) => {
          setPage(model.page);
          setPageSize(model.pageSize);
        }}
        onCellEditStop={handleCellEditStop}
        onRowSelectionModelChange={(newSelection) => {
          setSelectedRows(newSelection as string[]);
        }}
        rowSelectionModel={selectedRows}
        checkboxSelection
        disableRowSelectionOnClick
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        onRowClick={(params) => {
          if (onProductClick) {
            onProductClick(params.row);
          }
        }}
        processRowUpdate={(newRow, oldRow) => {
          return newRow;
        }}
        onProcessRowUpdateError={(error) => {
          toast.error('Error updating row: ' + error.message);
        }}
      />
    </Box>
  );
});
