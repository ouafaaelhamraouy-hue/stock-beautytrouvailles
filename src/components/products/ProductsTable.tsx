'use client';

import { useState, useEffect } from 'react';
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
import { useQuery } from '@tanstack/react-query';

import { Product } from '@/hooks/useProducts';

interface ProductTableItem {
  id: string;
  name: string;
  brand?: string | null;
  brandId?: string | null;
  description?: string | null;
  category: {
    id: string;
    name: string;
  };
  purchaseSource: 'ACTION' | 'CARREFOUR' | 'PHARMACIE' | 'AMAZON_FR' | 'SEPHORA' | 'RITUALS' | 'NOCIBE' | 'LIDL' | 'OTHER';
  purchasePriceEur?: number | null;
  purchasePriceMad: number;
  sellingPriceDh: number;
  promoPriceDh?: number | null;
  quantityReceived: number;
  quantitySold: number;
  currentStock: number;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
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
  const [productToEdit, setProductToEdit] = useState<ProductTableItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductTableItem | null>(null);
  const isAdmin = profile?.role === 'ADMIN';
  
  // Transform products to table format
  const tableProducts: ProductTableItem[] = products.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    brandId: null,
    description: null,
    category: {
      id: p.categoryId,
      name: p.category,
    },
    purchaseSource: p.purchaseSource,
    purchasePriceEur: p.purchasePriceEur,
    purchasePriceMad: p.purchasePriceMad,
    sellingPriceDh: p.sellingPriceDh,
    promoPriceDh: p.promoPriceDh,
    quantityReceived: p.quantityReceived,
    quantitySold: p.quantitySold,
    currentStock: p.currentStock,
    reorderLevel: p.reorderLevel,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  // Fetch brands
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await fetch('/api/brands');
      if (!response.ok) throw new Error('Failed to fetch brands');
      const data = await response.json();
      return data.brands || [];
    },
  });

  const brands: Brand[] = brandsData || [];

  const handleCreate = () => {
    setProductToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    const tableProduct: ProductTableItem = {
      id: product.id,
      name: product.name,
      brand: product.brand,
      brandId: null,
      description: null,
      category: {
        id: product.categoryId,
        name: product.category,
      },
      purchaseSource: product.purchaseSource,
      purchasePriceEur: product.purchasePriceEur,
      purchasePriceMad: product.purchasePriceMad,
      sellingPriceDh: product.sellingPriceDh,
      promoPriceDh: product.promoPriceDh,
      quantityReceived: product.quantityReceived,
      quantitySold: product.quantitySold,
      currentStock: product.currentStock,
      reorderLevel: product.reorderLevel,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
    setProductToEdit(tableProduct);
    setFormOpen(true);
  };

  const handleDelete = (product: Product) => {
    const tableProduct: ProductTableItem = {
      id: product.id,
      name: product.name,
      brand: product.brand,
      brandId: null,
      description: null,
      category: {
        id: product.categoryId,
        name: product.category,
      },
      purchaseSource: product.purchaseSource,
      purchasePriceEur: product.purchasePriceEur,
      purchasePriceMad: product.purchasePriceMad,
      sellingPriceDh: product.sellingPriceDh,
      promoPriceDh: product.promoPriceDh,
      quantityReceived: product.quantityReceived,
      quantitySold: product.quantitySold,
      currentStock: product.currentStock,
      reorderLevel: product.reorderLevel,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
    setProductToDelete(tableProduct);
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
    const method = productToEdit ? 'PATCH' : 'POST';

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
      Name: p.name,
      Brand: p.brand || '',
      Category: p.category.name,
      Source: p.purchaseSource,
      'PA (EUR)': p.purchasePriceEur || '',
      'PA (MAD)': p.purchasePriceMad,
      'PV (DH)': p.sellingPriceDh,
      'Promo (DH)': p.promoPriceDh || '',
      'Quantity Received': p.quantityReceived,
      'Quantity Sold': p.quantitySold,
      'Current Stock': p.currentStock,
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
        Name: p.name,
        Brand: p.brand || '',
        Category: p.category,
        Source: p.purchaseSource,
        'PA (EUR)': p.purchasePriceEur || '',
        'PA (MAD)': p.purchasePriceMad,
        'PV (DH)': p.sellingPriceDh,
        'Promo (DH)': p.promoPriceDh || '',
        'Quantity Received': p.quantityReceived,
        'Quantity Sold': p.quantitySold,
        'Current Stock': p.currentStock,
        'Reorder Level': p.reorderLevel,
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

  const columns: GridColDef<ProductTableItem>[] = [
    { field: 'name', headerName: 'Produit', width: 200, flex: 1 },
    {
      field: 'brand',
      headerName: 'Marque',
      width: 120,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'category',
      headerName: 'Catégorie',
      width: 150,
      valueGetter: (value, row) => row.category.name,
    },
    {
      field: 'purchaseSource',
      headerName: 'Source',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={PURCHASE_SOURCE_LABELS[params.value] || params.value}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'purchasePriceEur',
      headerName: 'PA (EUR)',
      width: 100,
      renderCell: (params) => (
        params.value ? (
          <CurrencyDisplay amount={params.value} currency="EUR" variant="body2" />
        ) : (
          <span style={{ color: '#999' }}>-</span>
        )
      ),
    },
    {
      field: 'purchasePriceMad',
      headerName: 'PA (MAD)',
      width: 100,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
      ),
    },
    {
      field: 'sellingPriceDh',
      headerName: 'PV (DH)',
      width: 100,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
      ),
    },
    {
      field: 'promoPriceDh',
      headerName: 'Promo (DH)',
      width: 110,
      renderCell: (params) => (
        params.value ? (
          <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
        ) : (
          <span style={{ color: '#999' }}>-</span>
        )
      ),
    },
    {
      field: 'currentStock',
      headerName: 'Stock',
      width: 100,
      renderCell: (params) => {
        const stock = params.value as number;
        const product = params.row as Product;
        const isLow = stock <= product.reorderLevel;
        const isOut = stock === 0;
        return (
          <Chip
            label={stock}
            color={isOut ? 'error' : isLow ? 'warning' : 'success'}
            size="small"
          />
        );
      },
    },
    {
      field: 'quantitySold',
      headerName: 'Vendu',
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
        rows={tableProducts}
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
        initialData={productToEdit ? {
          id: productToEdit.id,
          name: productToEdit.name,
          brandId: productToEdit.brandId || null,
          description: productToEdit.description,
          categoryId: productToEdit.category.id,
          purchaseSource: productToEdit.purchaseSource,
          purchasePriceEur: productToEdit.purchasePriceEur,
          purchasePriceMad: productToEdit.purchasePriceMad,
          sellingPriceDh: productToEdit.sellingPriceDh,
          promoPriceDh: productToEdit.promoPriceDh,
          quantityReceived: productToEdit.quantityReceived,
          reorderLevel: productToEdit.reorderLevel,
        } : undefined}
        categories={categories}
        brands={brands}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => {
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
