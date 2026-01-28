'use client';

import {
  DataGrid,
  GridColDef,
  GridToolbar,
} from '@mui/x-data-grid';
import { Box, Button, LinearProgress } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { CurrencyDisplay } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import WarehouseIcon from '@mui/icons-material/Warehouse';

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

  const handleExportExcel = () => {
    if (items.length === 0) {
      toast.error('No inventory items to export');
      return;
    }

    try {
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
      align: 'center',
    },
    {
      field: 'quantitySold',
      headerName: tInventory('sold'),
      width: 100,
      align: 'center',
    },
    {
      field: 'quantityRemaining',
      headerName: tInventory('remaining'),
      width: 120,
      align: 'center',
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
      align: 'center',
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
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
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
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Box>
      </Box>

      <DataGrid
        rows={items}
        columns={columns}
        disableRowSelectionOnClick
        slots={{
          toolbar: GridToolbar,
        }}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25 },
          },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        sx={{
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
            '&:focus': {
              outline: 'none',
            },
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderBottom: '2px solid rgba(0, 0, 0, 0.12)',
            fontWeight: 600,
          },
          '& .MuiDataGrid-toolbarContainer': {
            padding: '12px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
        }}
      />
    </Box>
  );
}
