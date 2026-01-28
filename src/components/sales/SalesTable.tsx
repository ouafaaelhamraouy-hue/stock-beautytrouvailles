'use client';

import { useState } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowSelectionModel,
  GridToolbar,
} from '@mui/x-data-grid';
import { Box, Button, Chip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';
import { SaleForm } from './SaleForm';
import { ConfirmDialog } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';
import type { SaleFormData } from '@/lib/validations';

interface Sale {
  id: string;
  saleDate: string;
  product: {
    id: string;
    sku: string;
    name: string;
    category: {
      name: string;
    };
  };
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  isPromo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  basePriceEUR: number;
  basePriceDH: number;
  availableStock: number;
  category: {
    name: string;
  };
}

interface SalesTableProps {
  sales: Sale[];
  products: Product[];
  onRefresh: () => void;
}

export function SalesTable({ sales, products, onRefresh }: SalesTableProps) {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const tSales = useTranslations('sales');
  const { profile } = useUserProfile();
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const isAdmin = profile?.role === 'ADMIN';

  const handleCreate = () => {
    setSaleToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (sale: Sale) => {
    setSaleToEdit(sale);
    setFormOpen(true);
  };

  const handleViewReceipt = (sale: Sale) => {
    router.push(`/sales/${sale.id}`);
  };

  const handleDelete = (sale: Sale) => {
    setSaleToDelete(sale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;

    try {
      const response = await fetch(`/api/sales/${saleToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete sale');
      }

      toast.success('Sale deleted successfully');
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
      onRefresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete sale');
    }
  };

  const handleFormSubmit = async (data: SaleFormData) => {
    const url = saleToEdit ? `/api/sales/${saleToEdit.id}` : '/api/sales';
    const method = saleToEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save sale');
    }

    toast.success(saleToEdit ? 'Sale updated successfully' : 'Sale created successfully');
    setFormOpen(false);
    setSaleToEdit(null);
    onRefresh();
  };

  const columns: GridColDef[] = [
    {
      field: 'saleDate',
      headerName: tSales('saleDate'),
      width: 150,
      valueGetter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'product',
      headerName: tSales('product'),
      width: 250,
      flex: 1,
      valueGetter: (value, row) => `${row.product.sku} - ${row.product.name}`,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.row.product.sku} - {params.row.product.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.product.category.name}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'quantity',
      headerName: tSales('quantity'),
      width: 100,
    },
    {
      field: 'pricePerUnit',
      headerName: tSales('pricePerUnit'),
      width: 130,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="EUR" variant="body2" />
      ),
    },
    {
      field: 'totalAmount',
      headerName: tSales('totalAmount'),
      width: 130,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="EUR" variant="body2" />
      ),
    },
    {
      field: 'isPromo',
      headerName: 'Promo',
      width: 100,
      renderCell: (params) => (
        params.value ? (
          <Chip label="Yes" color="success" size="small" />
        ) : (
          <Chip label="No" size="small" />
        )
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => {
        const actions = [];
        actions.push(
          <GridActionsCellItem
            icon={<ReceiptIcon />}
            label="Receipt"
            onClick={() => handleViewReceipt(params.row)}
          />
        );
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'SALES_UPDATE')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleEdit(params.row)}
            />
          );
        }
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'SALES_DELETE')) {
          actions.push(
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              onClick={() => handleDelete(params.row)}
              showInMenu
            />
          );
        }
        return actions;
      },
    },
  ];

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {sales.length > 0 && (
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          {hasPermission(profile?.role || 'STAFF', 'SALES_CREATE') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                },
              }}
            >
              {t('create')} {tNav('sales')}
            </Button>
          )}
        </Box>
      )}

      {sales.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <p>No sales found. Create your first sale.</p>
          {hasPermission(profile?.role || 'STAFF', 'SALES_CREATE') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ mt: 2 }}
            >
              {t('create')} {tNav('sales')}
            </Button>
          )}
        </Box>
      ) : (
        <DataGrid
          rows={sales}
          columns={columns}
          checkboxSelection={isAdmin}
          rowSelectionModel={selectedRows}
          onRowSelectionModelChange={setSelectedRows}
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
      )}

      <SaleForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSaleToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={saleToEdit || undefined}
        products={products}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSaleToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Sale"
        message={`Are you sure you want to delete this sale? Stock will be restored.`}
        confirmColor="error"
        confirmLabel="Delete"
      />
    </Box>
  );
}
