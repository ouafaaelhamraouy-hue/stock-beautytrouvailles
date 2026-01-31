'use client';

import { useState } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowSelectionModel,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  Typography,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LabelIcon from '@mui/icons-material/Label';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';
import { SaleForm } from './SaleForm';
import { BundleSaleForm } from './BundleSaleForm';
import { BulkActionBar, ConfirmDialog, TableHeader } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission, isAdmin as isAdminRole } from '@/lib/permissions';
import type { SaleFormData } from '@/lib/validations';

interface Sale {
  id: string;
  saleDate: string;
  product?: {
    id: string;
    name: string;
    category: {
      name: string;
    };
  } | null;
  quantity?: number | null;
  pricePerUnit?: number | null;
  totalAmount: number;
  pricingMode: 'REGULAR' | 'PROMO' | 'CUSTOM' | 'BUNDLE';
  bundleQty?: number | null;
  bundlePriceTotal?: number | null;
  items?: Array<{
    productId: string;
    quantity: number;
    pricePerUnit: number;
    product: {
      id: string;
      name: string;
      category: {
        name: string;
      };
    };
  }>;
  isPromo: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  sellingPriceDh: number;
  promoPriceDh: number | null;
  purchasePriceMad: number;
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
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const { profile } = useUserProfile();
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [bundleFormOpen, setBundleFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [markMenuAnchor, setMarkMenuAnchor] = useState<null | HTMLElement>(null);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [bundleToEdit, setBundleToEdit] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const isAdmin = profile ? isAdminRole(profile.role) : false;

  const handleCreate = () => {
    setSaleToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (sale: Sale) => {
    if (sale.pricingMode === 'BUNDLE') {
      setBundleToEdit(sale);
      setBundleFormOpen(true);
      return;
    }
    setSaleToEdit(sale);
    setFormOpen(true);
  };

  const handleCreateBundle = () => {
    setBundleToEdit(null);
    setBundleFormOpen(true);
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

  const handleBundleSubmit = async (data: SaleFormData) => {
    const url = bundleToEdit ? `/api/sales/${bundleToEdit.id}` : '/api/sales';
    const method = bundleToEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save bundle sale');
    }

    toast.success(bundleToEdit ? 'Bundle sale updated successfully' : 'Bundle sale created successfully');
    setBundleFormOpen(false);
    setBundleToEdit(null);
    onRefresh();
  };

  const handleBulkExport = async () => {
    if (selectedRows.length === 0) return;
    const XLSX = await import('xlsx');
    const selected = sales.filter((sale) => selectedRows.includes(sale.id));
    const excelData = selected.map((sale) => {
      const quantity = sale.pricingMode === 'BUNDLE'
        ? (sale.items || []).reduce((sum, item) => sum + item.quantity, 0)
        : sale.quantity ?? 0;
      const productLabel = sale.pricingMode === 'BUNDLE'
        ? `Bundle (${(sale.items || []).length} items)`
        : sale.product?.name || 'Sale';
      return {
        Date: sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : '-',
        Product: productLabel,
        Quantity: quantity,
        Pricing: sale.pricingMode,
        Total: sale.totalAmount,
        Promo: sale.isPromo ? 'Yes' : 'No',
      };
    });
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `sales-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Selected sales exported');
  };

  const handleBulkMarkPromo = async (isPromo: boolean) => {
    if (selectedRows.length === 0) return;
    const ids = selectedRows.map((id) => String(id));
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const response = await fetch(`/api/sales/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPromo }),
        });
        if (!response.ok) {
          throw new Error('Failed to update sale');
        }
      })
    );
    const failed = results.filter((result) => result.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) {
      toast.success(`Updated ${succeeded} sale${succeeded === 1 ? '' : 's'}`);
    }
    if (failed > 0) {
      toast.error(`Failed to update ${failed} sale${failed === 1 ? '' : 's'}`);
    }
    setMarkMenuAnchor(null);
    onRefresh();
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedRows.length === 0) return;
    const ids = selectedRows.map((id) => String(id));
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const response = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete sale');
        }
      })
    );
    const failed = results.filter((result) => result.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) {
      toast.success(`Deleted ${succeeded} sale${succeeded === 1 ? '' : 's'}`);
    }
    if (failed > 0) {
      toast.error(`Failed to delete ${failed} sale${failed === 1 ? '' : 's'}`);
    }
    setBulkDeleteDialogOpen(false);
    setSelectedRows([]);
    onRefresh();
  };

  const columns: GridColDef[] = [
    {
      field: 'saleDate',
      headerName: tSales('saleDate'),
      width: isSmDown ? 120 : 150,
      valueGetter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'product',
      headerName: tSales('product'),
      width: isSmDown ? 200 : 250,
      flex: 1,
      valueGetter: (value, row) => row.pricingMode === 'BUNDLE'
        ? 'Bundle'
        : row.product?.name || 'Sale',
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.row.pricingMode === 'BUNDLE'
              ? `Bundle (${(params.row.items || []).length} items)`
              : params.row.product?.name || 'Sale'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.pricingMode === 'BUNDLE'
              ? (params.row.items || []).map((item: { product: { name: string } }) => item.product.name).slice(0, 2).join(', ') +
                ((params.row.items || []).length > 2 ? '…' : '')
              : params.row.product?.category.name}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'quantity',
      headerName: tSales('quantity'),
      width: isSmDown ? 80 : 100,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (value, row) => {
        if (row.pricingMode === 'BUNDLE') {
          return (row.items || []).reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
        }
        return value ?? 0;
      },
    },
    {
      field: 'pricePerUnit',
      headerName: tSales('pricePerUnit'),
      width: isSmDown ? 110 : 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) =>
        params.row.pricingMode === 'BUNDLE'
          ? <Typography variant="body2" color="text.secondary">Mixed</Typography>
          : <CurrencyDisplay amount={params.value || 0} currency="DH" variant="body2" />,
    },
    {
      field: 'pricingMode',
      headerName: 'Pricing',
      width: isSmDown ? 130 : 160,
      renderCell: (params) => {
        const mode = params.value as Sale['pricingMode'];
        if (mode === 'BUNDLE') {
          const totalItems = (params.row.items || []).reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
          const total = params.row.bundlePriceTotal || params.row.totalAmount || 0;
          return (
            <Chip
              label={`Bundle ${totalItems} items • ${total} MAD`}
              size="small"
              color="info"
              variant="outlined"
            />
          );
        }
        return (
          <Chip
            label={mode}
            size="small"
            color={mode === 'PROMO' ? 'success' : mode === 'CUSTOM' ? 'warning' : 'default'}
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'totalAmount',
      headerName: tSales('totalAmount'),
      width: isSmDown ? 120 : 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
      ),
    },
    {
      field: 'isPromo',
      headerName: 'Promo',
      width: isSmDown ? 90 : 100,
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
      width: isSmDown ? 60 : 70,
      getActions: (params) => {
        const actions = [];
        actions.push(
          <GridActionsCellItem
            icon={<ReceiptIcon />}
            label="Receipt"
            onClick={() => handleViewReceipt(params.row)}
            showInMenu
          />
        );
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'SALES_UPDATE')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleEdit(params.row)}
              showInMenu
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
        <TableHeader
          left={
            <>
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
              {hasPermission(profile?.role || 'STAFF', 'SALES_CREATE') && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleCreateBundle}
                >
                  Create Bundle
                </Button>
              )}
            </>
          }
          totalCount={sales.length}
          selectedCount={selectedRows.length}
          right={
            <Tooltip title="Refresh">
              <IconButton onClick={onRefresh} size="small">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        />
      )}

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
                disabled={!hasPermission(profile?.role || 'STAFF', 'SALES_UPDATE')}
              >
                Mark promo
              </Button>
              <Menu
                anchorEl={markMenuAnchor}
                open={Boolean(markMenuAnchor)}
                onClose={() => setMarkMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <MenuItem onClick={() => handleBulkMarkPromo(true)}>Promo</MenuItem>
                <MenuItem onClick={() => handleBulkMarkPromo(false)}>Regular</MenuItem>
              </Menu>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={!hasPermission(profile?.role || 'STAFF', 'SALES_DELETE')}
              >
                Delete
              </Button>
            </>
          }
        />
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
          {hasPermission(profile?.role || 'STAFF', 'SALES_CREATE') && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateBundle}
              sx={{ mt: 2, ml: 2 }}
            >
              Create Bundle
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
          columnVisibilityModel={
            isSmDown
              ? { pricingMode: false, isPromo: false, pricePerUnit: false }
              : undefined
          }
          density={isSmDown ? 'compact' : 'standard'}
          rowHeight={isSmDown ? 48 : 56}
          columnHeaderHeight={isSmDown ? 44 : 52}
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
              flexWrap: 'wrap',
              gap: 1,
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid',
              borderColor: 'divider',
            },
          })}
        />
      )}

      <SaleForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSaleToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={saleToEdit ? {
          id: saleToEdit.id,
          productId: saleToEdit.product?.id ?? '',
          quantity: saleToEdit.quantity ?? 1,
          pricePerUnit: saleToEdit.pricePerUnit ?? 0,
          pricingMode: saleToEdit.pricingMode,
          bundleQty: saleToEdit.bundleQty ?? undefined,
          bundlePriceTotal: saleToEdit.bundlePriceTotal ?? undefined,
          isPromo: saleToEdit.isPromo,
          saleDate: saleToEdit.saleDate,
        } : undefined}
        products={products}
      />

      <BundleSaleForm
        open={bundleFormOpen}
        onClose={() => {
          setBundleFormOpen(false);
          setBundleToEdit(null);
        }}
        onSubmit={handleBundleSubmit}
        initialData={bundleToEdit && bundleToEdit.items ? {
          id: bundleToEdit.id,
          saleDate: bundleToEdit.saleDate,
          notes: bundleToEdit.notes,
          items: bundleToEdit.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            productName: item.product.name,
          })),
        } : undefined}
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

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Sales"
        message={`Are you sure you want to delete ${selectedRows.length} sale${selectedRows.length === 1 ? '' : 's'}? Stock will be restored.`}
        confirmColor="error"
        confirmLabel="Delete"
      />
    </Box>
  );
}
