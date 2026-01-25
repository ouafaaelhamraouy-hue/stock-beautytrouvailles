'use client';

import { useState } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridToolbar,
} from '@mui/x-data-grid';
import { Box, Button, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ExpenseForm } from './ExpenseForm';
import { ConfirmDialog } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';

interface Expense {
  id: string;
  date: string;
  amountEUR: number;
  amountDH: number;
  description: string;
  type: 'OPERATIONAL' | 'MARKETING' | 'UTILITIES' | 'OTHER';
  shipmentId?: string | null;
  shipment?: {
    id: string;
    reference: string;
    supplier: {
      name: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Shipment {
  id: string;
  reference: string;
  supplier: {
    name: string;
  };
}

interface ExpensesTableProps {
  expenses: Expense[];
  shipments: Shipment[];
  onRefresh: () => void;
}

export function ExpensesTable({ expenses, shipments, onRefresh }: ExpensesTableProps) {
  const t = useTranslations('common');
  const tExpenses = useTranslations('expenses');
  const { profile } = useUserProfile();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const isAdmin = profile?.role === 'ADMIN';

  const handleCreate = () => {
    setExpenseToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setExpenseToEdit(expense);
    setFormOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;

    try {
      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete expense');
      }

      toast.success('Expense deleted successfully');
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete expense');
    }
  };

  const handleFormSubmit = async (data: any) => {
    const url = expenseToEdit ? `/api/expenses/${expenseToEdit.id}` : '/api/expenses';
    const method = expenseToEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save expense');
    }

    toast.success(expenseToEdit ? 'Expense updated successfully' : 'Expense created successfully');
    setFormOpen(false);
    setExpenseToEdit(null);
    onRefresh();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      OPERATIONAL: tExpenses('operational'),
      MARKETING: tExpenses('marketing'),
      UTILITIES: tExpenses('utilities'),
      OTHER: tExpenses('other'),
    };
    return labels[type] || type;
  };

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: tExpenses('date'),
      width: 150,
      valueGetter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'description',
      headerName: tExpenses('description'),
      width: 250,
      flex: 1,
    },
    {
      field: 'type',
      headerName: tExpenses('type'),
      width: 150,
      valueGetter: (value) => getTypeLabel(value),
    },
    {
      field: 'amountEUR',
      headerName: `${tExpenses('amount')} (EUR)`,
      width: 150,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="EUR" variant="body2" />
      ),
    },
    {
      field: 'amountDH',
      headerName: `${tExpenses('amount')} (DH)`,
      width: 150,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
      ),
    },
    {
      field: 'shipment',
      headerName: tExpenses('shipment'),
      width: 200,
      valueGetter: (value, row) => row.shipment ? row.shipment.reference : '-',
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => {
        const actions = [];
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'EXPENSES_UPDATE')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleEdit(params.row)}
            />
          );
        }
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'EXPENSES_DELETE')) {
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
      {expenses.length > 0 && (
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'EXPENSES_CREATE') && (
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
              {t('create')} {tExpenses('title')}
            </Button>
          )}
        </Box>
      )}

      {expenses.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <p>{tExpenses('noExpenses')}</p>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'EXPENSES_CREATE') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ mt: 2 }}
            >
              {t('create')} {tExpenses('title')}
            </Button>
          )}
        </Box>
      ) : (
        <DataGrid
          rows={expenses}
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
      )}

      <ExpenseForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setExpenseToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={expenseToEdit || undefined}
        shipments={shipments}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense? This action cannot be undone.`}
        confirmColor="error"
        confirmLabel="Delete"
      />
    </Box>
  );
}
