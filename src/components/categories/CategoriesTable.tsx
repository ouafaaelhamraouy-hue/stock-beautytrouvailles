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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CategoryForm } from './CategoryForm';
import { BulkActionBar, ConfirmDialog, TableHeader } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission, isAdmin as isAdminRole } from '@/lib/permissions';
import type { CategoryFormData } from '@/lib/validations';

interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesTableProps {
  categories: Category[];
  onRefresh: () => void;
}

export function CategoriesTable({ categories, onRefresh }: CategoriesTableProps) {
  const t = useTranslations('common');
  const { profile } = useUserProfile();
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const isAdmin = profile ? isAdminRole(profile.role) : false;

  const handleCreate = () => {
    setCategoryToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }

      toast.success('Category deleted successfully');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      onRefresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  const handleFormSubmit = async (data: CategoryFormData) => {
    const url = categoryToEdit ? `/api/categories/${categoryToEdit.id}` : '/api/categories';
    const method = categoryToEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save category');
    }

    toast.success(categoryToEdit ? 'Category updated successfully' : 'Category created successfully');
    setFormOpen(false);
    setCategoryToEdit(null);
    onRefresh();
  };

  const handleBulkExport = async () => {
    if (selectedRows.length === 0) return;
    const XLSX = await import('xlsx');
    const selected = categories.filter((category) => selectedRows.includes(category.id));
    const excelData = selected.map((category) => ({
      Name: category.name,
      Description: category.description || '',
      Created: new Date(category.createdAt).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');
    XLSX.writeFile(wb, `categories-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Selected categories exported');
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedRows.length === 0) return;

    const ids = selectedRows.map((id) => String(id));
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete category');
        }
      })
    );

    const failed = results.filter((result) => result.status === 'rejected').length;
    const succeeded = results.length - failed;

    if (succeeded > 0) {
      toast.success(`Deleted ${succeeded} categor${succeeded === 1 ? 'y' : 'ies'}`);
    }
    if (failed > 0) {
      toast.error(`Failed to delete ${failed} categor${failed === 1 ? 'y' : 'ies'}`);
    }

    setBulkDeleteDialogOpen(false);
    setSelectedRows([]);
    onRefresh();
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'description', headerName: 'Description', width: 300, flex: 2 },
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
      {categories.length > 0 && (
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
                {t('create')} Category
              </Button>
            ) : null
          }
          totalCount={categories.length}
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

      {categories.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <p>No categories found. Create your first category.</p>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_CREATE') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ mt: 2 }}
            >
              {t('create')} Category
            </Button>
          )}
        </Box>
      ) : (
      <DataGrid
        rows={categories}
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

      <CategoryForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setCategoryToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={categoryToEdit || undefined}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
        confirmColor="error"
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Categories"
        message={`Are you sure you want to delete ${selectedRows.length} categor${selectedRows.length === 1 ? 'y' : 'ies'}? This action cannot be undone.`}
        confirmColor="error"
        confirmLabel="Delete"
      />
    </Box>
  );
}
