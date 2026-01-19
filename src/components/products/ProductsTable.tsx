'use client';

import { useState } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowSelectionModel,
  GridToolbar,
} from '@mui/x-data-grid';
import { Box, Button, IconButton, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ProductForm } from './ProductForm';
import { ConfirmDialog } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  category: {
    id: string;
    name: string;
  };
  basePriceEUR: number;
  basePriceDH: number;
  totalStock: number;
  totalSold: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductsTableProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
}

export function ProductsTable({ products, categories, onRefresh }: ProductsTableProps) {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const { profile } = useUserProfile();
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const isAdmin = profile?.role === 'ADMIN';

  const handleCreate = () => {
    setProductToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setFormOpen(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    try {
      const deletePromises = selectedRows.map((id) =>
        fetch(`/api/products/${id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      toast.success(`${selectedRows.length} products deleted successfully`);
      setSelectedRows([]);
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete products');
    }
  };

  const handleFormSubmit = async (data: any) => {
    const url = productToEdit ? `/api/products/${productToEdit.id}` : '/api/products';
    const method = productToEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save product');
    }

    setFormOpen(false);
    setProductToEdit(null);
    onRefresh();
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }

    const csvData = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.category.name,
      'Base Price (EUR)': p.basePriceEUR,
      'Base Price (DH)': p.basePriceDH,
      'Total Stock': p.totalStock,
      'Total Sold': p.totalSold,
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Products exported to CSV');
  };

  const handleExportExcel = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }

    try {
      const excelData = products.map((p) => ({
        SKU: p.sku,
        Name: p.name,
        Description: p.description || '',
        Category: p.category.name,
        'Base Price (EUR)': p.basePriceEUR,
        'Base Price (DH)': p.basePriceDH,
        'Total Stock': p.totalStock,
        'Total Sold': p.totalSold,
        'Created At': new Date(p.createdAt).toLocaleDateString(),
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      XLSX.writeFile(wb, `products-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Products exported to Excel');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export to Excel');
    }
  };

  const columns: GridColDef[] = [
    { field: 'sku', headerName: 'SKU', width: 120, flex: 0 },
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      valueGetter: (value, row) => row.category.name,
    },
    {
      field: 'basePriceEUR',
      headerName: 'Price (EUR)',
      width: 120,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="EUR" variant="body2" />
      ),
    },
    {
      field: 'basePriceDH',
      headerName: 'Price (DH)',
      width: 120,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
      ),
    },
    {
      field: 'totalStock',
      headerName: 'Stock',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value > 0 ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'totalSold',
      headerName: 'Sold',
      width: 100,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => {
        const actions = [];
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_UPDATE')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleEdit(params.row)}
            />
          );
        }
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_DELETE')) {
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
      {products.length > 0 && (
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_CREATE') && (
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
              {t('create')} {tNav('products')}
            </Button>
          )}
          {isAdmin && selectedRows.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleBulkDelete}
              sx={{
                borderColor: 'error.main',
                '&:hover': {
                  borderColor: 'error.dark',
                  backgroundColor: 'error.light',
                  color: 'white',
                },
              }}
            >
              Delete Selected ({selectedRows.length})
            </Button>
          )}
        </Box>
      )}

      <DataGrid
        rows={products}
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
            '&:focus-within': {
              outline: 'none',
            },
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.12)',
              },
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

      <ProductForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setProductToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={productToEdit || undefined}
        categories={categories}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmColor="error"
        confirmLabel="Delete"
      />
    </Box>
  );
}
