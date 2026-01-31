'use client';

import { useState } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowSelectionModel,
  GridToolbar,
} from '@mui/x-data-grid';
import { Box, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { BrandForm } from './BrandForm';
import { BulkActionBar, ConfirmDialog, TableHeader } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission, isAdmin as isAdminRole } from '@/lib/permissions';
import type { BrandFormData } from '@/lib/validations';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface Brand {
  id: string;
  name: string;
  country?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BrandsTableProps {
  brands: Brand[];
  onRefresh: () => void;
}

export function BrandsTable({ brands, onRefresh }: BrandsTableProps) {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const { profile } = useUserProfile();
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  const isAdmin = profile ? isAdminRole(profile.role) : false;

  const handleCreate = () => {
    setBrandToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    setBrandToEdit(brand);
    setFormOpen(true);
  };

  const handleDelete = (brand: Brand) => {
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!brandToDelete) return;

    try {
      const response = await fetch(`/api/brands/${brandToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete brand');
      }

      toast.success('Brand deleted successfully');
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
      onRefresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete brand');
    }
  };

  const handleFormSubmit = async (data: BrandFormData) => {
    const url = brandToEdit ? `/api/brands/${brandToEdit.id}` : '/api/brands';
    const method = brandToEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save brand');
    }

    toast.success(brandToEdit ? 'Brand updated successfully' : 'Brand created successfully');
    setFormOpen(false);
    setBrandToEdit(null);
    onRefresh();
  };

  const handleBulkExport = async () => {
    if (selectedRows.length === 0) return;
    const XLSX = await import('xlsx');
    const selected = brands.filter((brand) => selectedRows.includes(brand.id));
    const excelData = selected.map((brand) => ({
      Name: brand.name,
      Country: brand.country || '',
      Created: new Date(brand.createdAt).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Brands');
    XLSX.writeFile(wb, `brands-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Selected brands exported');
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedRows.length === 0) return;

    const ids = selectedRows.map((id) => String(id));
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const response = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete brand');
        }
      })
    );

    const failed = results.filter((result) => result.status === 'rejected').length;
    const succeeded = results.length - failed;

    if (succeeded > 0) {
      toast.success(`Deleted ${succeeded} brand${succeeded === 1 ? '' : 's'}`);
    }
    if (failed > 0) {
      toast.error(`Failed to delete ${failed} brand${failed === 1 ? '' : 's'}`);
    }

    setBulkDeleteDialogOpen(false);
    setSelectedRows([]);
    onRefresh();
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'country', headerName: 'Country', width: 150, flex: 1 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 70,
      getActions: (params) => {
        const actions = [];
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_UPDATE')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleEdit(params.row)}
              showInMenu
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
      {brands.length > 0 && (
        <TableHeader
          left={
            isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_CREATE') ? (
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
                {t('create')} {tNav('brands')}
              </Button>
            ) : null
          }
          totalCount={brands.length}
          selectedCount={selectedRows.length}
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
                startIcon={<DeleteIcon />}
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={!hasPermission(profile?.role || 'STAFF', 'PRODUCTS_DELETE')}
              >
                Delete selected
              </Button>
            </>
          }
        />
      )}

      {brands.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <p>No brands found. Create your first brand.</p>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_CREATE') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ mt: 2 }}
            >
              {t('create')} {tNav('brands')}
            </Button>
          )}
        </Box>
      ) : (
        <DataGrid
          rows={brands}
          columns={columns}
          checkboxSelection={isAdmin}
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
      )}

      <BrandForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setBrandToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={brandToEdit || undefined}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setBrandToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Brand"
        message={`Are you sure you want to delete "${brandToDelete?.name}"? This action cannot be undone.`}
        confirmColor="error"
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Brands"
        message={`Are you sure you want to delete ${selectedRows.length} brand${selectedRows.length === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmColor="error"
        confirmLabel="Delete"
      />
    </Box>
  );
}
