'use client';

import { useState } from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridToolbar,
} from '@mui/x-data-grid';
import { Box, Button, LinearProgress, Menu, MenuItem } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LabelIcon from '@mui/icons-material/Label';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { BulkActionBar, ConfirmDialog, CurrencyDisplay, EmptyState, StatusBadge, TableHeader } from '@/components/ui';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';

interface InventoryItem {
  id: string;
  product: {
    id: string;
    sku: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  shipment: {
    id: string;
    reference: string;
    supplier: {
      name: string;
    };
  };
  quantity: number;
  quantitySold: number;
  quantityRemaining: number;
  stockPercentage: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  costPerUnitEUR: number;
  costPerUnitDH: number;
  createdAt: string;
  updatedAt: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
}

export function InventoryTable({ items }: InventoryTableProps) {
  const tInventory = useTranslations('inventory');
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const { profile } = useUserProfile();
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [markMenuAnchor, setMarkMenuAnchor] = useState<null | HTMLElement>(null);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      in_stock: tInventory('inStock'),
      low_stock: tInventory('lowStock'),
      out_of_stock: tInventory('outOfStock'),
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      in_stock: 'success',
      low_stock: 'warning',
      out_of_stock: 'error',
    };
    return colors[status] || 'default';
  };

  const handleExportExcel = async () => {
    if (items.length === 0) {
      toast.error('No inventory items to export');
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const excelData = items.map((item) => ({
        SKU: item.product.sku,
        'Product Name': item.product.name,
        Category: item.product.category.name,
        'Shipment Reference': item.shipment.reference,
        Supplier: item.shipment.supplier.name,
        Quantity: item.quantity,
        Sold: item.quantitySold,
        Remaining: item.quantityRemaining,
        'Stock %': `${item.stockPercentage.toFixed(1)}%`,
        Status: getStatusLabel(item.status),
        'Cost Per Unit (EUR)': item.costPerUnitEUR,
        'Cost Per Unit (DH)': item.costPerUnitDH,
        'Total Cost (EUR)': (item.quantityRemaining * item.costPerUnitEUR).toFixed(2),
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      XLSX.writeFile(wb, `inventory-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Inventory report exported to Excel');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export to Excel');
    }
  };

  const handleBulkExport = async () => {
    if (selectedRows.length === 0) return;
    const XLSX = await import('xlsx');
    const selected = items.filter((item) => selectedRows.includes(item.id));
    const excelData = selected.map((item) => ({
      SKU: item.product.sku,
      'Product Name': item.product.name,
      Category: item.product.category.name,
      'Shipment Reference': item.shipment.reference,
      Supplier: item.shipment.supplier.name,
      Quantity: item.quantity,
      Sold: item.quantitySold,
      Remaining: item.quantityRemaining,
      'Stock %': `${item.stockPercentage.toFixed(1)}%`,
      Status: getStatusLabel(item.status),
      'Cost Per Unit (EUR)': item.costPerUnitEUR,
      'Cost Per Unit (DH)': item.costPerUnitDH,
      'Total Cost (EUR)': (item.quantityRemaining * item.costPerUnitEUR).toFixed(2),
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `inventory-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Selected inventory exported');
  };

  const handleBulkMarkOutOfStock = async () => {
    if (selectedRows.length === 0) return;
    const selected = items.filter((item) => selectedRows.includes(item.id));
    const targets = selected.filter((item) => item.quantityRemaining > 0);
    const skipped = selected.length - targets.length;

    const results = await Promise.allSettled(
      targets.map(async (item) => {
        const response = await fetch(`/api/products/${item.id}/adjust-stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            delta: -item.quantityRemaining,
            reason: 'Bulk mark out of stock',
            notes: 'Bulk inventory action',
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to update stock');
        }
      })
    );

    const failed = results.filter((result) => result.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) {
      toast.success(`Updated ${succeeded} item${succeeded === 1 ? '' : 's'}`);
    }
    if (failed > 0) {
      toast.error(`Failed to update ${failed} item${failed === 1 ? '' : 's'}`);
    }
    if (skipped > 0) {
      toast.info(`Skipped ${skipped} item${skipped === 1 ? '' : 's'} already out of stock`);
    }
    setMarkMenuAnchor(null);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedRows.length === 0) return;
    const ids = selectedRows.map((id) => String(id));
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete product');
        }
      })
    );
    const failed = results.filter((result) => result.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) {
      toast.success(`Deleted ${succeeded} item${succeeded === 1 ? '' : 's'}`);
    }
    if (failed > 0) {
      toast.error(`Failed to delete ${failed} item${failed === 1 ? '' : 's'}`);
    }
    setBulkDeleteDialogOpen(false);
    setSelectedRows([]);
  };

  const columns: GridColDef[] = [
    {
      field: 'product',
      headerName: tInventory('product'),
      width: 250,
      flex: 1,
      valueGetter: (value, row) => `${row.product.sku} - ${row.product.name}`,
      renderCell: (params) => (
        <Box>
          <Box sx={{ fontWeight: 500 }}>{params.row.product.sku}</Box>
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {params.row.product.name}
          </Box>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: tInventory('category'),
      width: 150,
      valueGetter: (value, row) => row.product.category.name,
    },
    {
      field: 'shipment',
      headerName: tInventory('shipment'),
      width: 150,
      valueGetter: (value, row) => row.shipment.reference,
    },
    {
      field: 'quantity',
      headerName: tInventory('quantity'),
      width: 100,
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'quantitySold',
      headerName: tInventory('sold'),
      width: 100,
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'quantityRemaining',
      headerName: tInventory('remaining'),
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ fontWeight: 600 }}>{params.value}</Box>
          <Box sx={{ width: 60 }}>
            <LinearProgress
              variant="determinate"
              value={params.row.stockPercentage}
              color={
                params.row.status === 'out_of_stock'
                  ? 'error'
                  : params.row.status === 'low_stock'
                  ? 'warning'
                  : 'success'
              }
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Box>
      ),
    },
    {
      field: 'stockPercentage',
      headerName: tInventory('stockPercentage'),
      width: 100,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      field: 'status',
      headerName: tInventory('status'),
      width: 130,
      renderCell: (params) => (
        <StatusBadge
          label={getStatusLabel(params.value)}
          status={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'costPerUnitEUR',
      headerName: `${tInventory('costPerUnit')} (EUR)`,
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="EUR" variant="body2" />
      ),
    },
  ];

  if (items.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <EmptyState
          title={tInventory('noInventoryItems')}
          message="Try adjusting your filters or add inventory through shipments."
          icon={<WarehouseIcon sx={{ fontSize: 64 }} />}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <TableHeader
        left={
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            sx={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {tInventory('exportReport')}
          </Button>
        }
        totalCount={items.length}
        selectedCount={selectedRows.length}
      />

      {selectedRows.length > 0 && (
        <BulkActionBar
          count={selectedRows.length}
          onClear={() => setSelectedRows([])}
          actions={
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleBulkExport}
              >
                Export
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<LabelIcon />}
                onClick={(event) => setMarkMenuAnchor(event.currentTarget)}
                disabled={!hasPermission(profile?.role || 'STAFF', 'STOCK_ADJUST')}
              >
                Mark status
              </Button>
              <Menu
                anchorEl={markMenuAnchor}
                open={Boolean(markMenuAnchor)}
                onClose={() => setMarkMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <MenuItem onClick={handleBulkMarkOutOfStock}>Out of Stock</MenuItem>
              </Menu>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={!hasPermission(profile?.role || 'STAFF', 'PRODUCTS_DELETE')}
              >
                Delete
              </Button>
            </>
          }
        />
      )}

      <DataGrid
        rows={items}
        columns={columns}
        checkboxSelection
        rowSelectionModel={selectedRows}
        onRowSelectionModelChange={setSelectedRows}
        disableRowSelectionOnClick
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'MuiDataGrid-row--striped' : ''
        }
        slots={{
          toolbar: GridToolbar,
        }}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25 },
          },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        sx={(theme) => ({
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:focus': {
              outline: 'none',
            },
          },
          '& .MuiDataGrid-row--striped': {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(0, 0, 0, 0.02)',
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider',
            fontWeight: 600,
            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
          },
          '& .MuiDataGrid-toolbarContainer': {
            padding: '12px 16px',
            backgroundColor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid',
            borderColor: 'divider',
          },
        })}
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Inventory Items"
        message={`Are you sure you want to delete ${selectedRows.length} item${selectedRows.length === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmColor="error"
        confirmLabel="Delete"
      />
    </Box>
  );
}
