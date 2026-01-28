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
import { CategoryForm } from './CategoryForm';
import { ConfirmDialog } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';
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
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const isAdmin = profile?.role === 'ADMIN';

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

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'description', headerName: 'Description', width: 300, flex: 2 },
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
      {categories.length > 0 && (
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
              {t('create')} Category
            </Button>
          )}
        </Box>
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
    </Box>
  );
}
