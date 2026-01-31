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
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LabelIcon from '@mui/icons-material/Label';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ExpenseForm } from './ExpenseForm';
import { BulkActionBar, ConfirmDialog, TableHeader } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission, isAdmin as isAdminRole } from '@/lib/permissions';
import type { ExpenseFormData } from '@/lib/validations';

type DecimalLike = { toNumber: () => number };

interface Expense {
  id: string;
  date: string;
  amountEUR: number | DecimalLike; // Can be Decimal
  amountDH: number | DecimalLike; // Can be Decimal
  description: string;
  type: 'OPERATIONAL' | 'MARKETING' | 'UTILITIES' | 'PACKAGING' | 'SHIPPING' | 'ADS' | 'OTHER';
  shipmentId?: string | null;
  arrivageId?: string | null;
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
  showShipmentColumn?: boolean;
  defaultShipmentId?: string;
  exchangeRate?: number;
}

export function ExpensesTable({
  expenses,
  shipments,
  onRefresh,
  showShipmentColumn = true,
  defaultShipmentId,
  exchangeRate,
}: ExpensesTableProps) {
  const t = useTranslations('common');
  const tExpenses = useTranslations('expenses');
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const { profile } = useUserProfile();
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [markMenuAnchor, setMarkMenuAnchor] = useState<null | HTMLElement>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const isAdmin = profile ? isAdminRole(profile.role) : false;

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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete expense');
    }
  };

  const handleFormSubmit = async (data: ExpenseFormData) => {
    const url = expenseToEdit ? `/api/expenses/${expenseToEdit.id}` : '/api/expenses';
    const method = expenseToEdit ? 'PUT' : 'POST';

    const submitData = defaultShipmentId
      ? { ...data, shipmentId: defaultShipmentId }
      : data;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
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

  const handleBulkExport = async () => {
    if (selectedRows.length === 0) return;
    const XLSX = await import('xlsx');
    const selected = expenses.filter((expense) => selectedRows.includes(expense.id));
    const excelData = selected.map((expense) => {
      const amountEur = typeof expense.amountEUR === 'object' && 'toNumber' in expense.amountEUR
        ? expense.amountEUR.toNumber()
        : expense.amountEUR || 0;
      const amountDh = typeof expense.amountDH === 'object' && 'toNumber' in expense.amountDH
        ? expense.amountDH.toNumber()
        : expense.amountDH || 0;
      return {
        Date: expense.date ? new Date(expense.date).toLocaleDateString() : '-',
        Description: expense.description,
        Type: getTypeLabel(expense.type),
        'Amount (EUR)': amountEur,
        'Amount (DH)': amountDh,
        Shipment: expense.shipment ? expense.shipment.reference : '-',
      };
    });
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, `expenses-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Selected expenses exported');
  };

  const handleBulkMarkType = async (type: Expense['type']) => {
    if (selectedRows.length === 0) return;
    const ids = selectedRows.map((id) => String(id));
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const response = await fetch(`/api/expenses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        });
        if (!response.ok) {
          throw new Error('Failed to update expense');
        }
      })
    );
    const failed = results.filter((result) => result.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) {
      toast.success(`Updated ${succeeded} expense${succeeded === 1 ? '' : 's'}`);
    }
    if (failed > 0) {
      toast.error(`Failed to update ${failed} expense${failed === 1 ? '' : 's'}`);
    }
    setMarkMenuAnchor(null);
    onRefresh();
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedRows.length === 0) return;
    const ids = selectedRows.map((id) => String(id));
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete expense');
        }
      })
    );
    const failed = results.filter((result) => result.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) {
      toast.success(`Deleted ${succeeded} expense${succeeded === 1 ? '' : 's'}`);
    }
    if (failed > 0) {
      toast.error(`Failed to delete ${failed} expense${failed === 1 ? '' : 's'}`);
    }
    setBulkDeleteDialogOpen(false);
    setSelectedRows([]);
    onRefresh();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      OPERATIONAL: tExpenses('operational'),
      MARKETING: tExpenses('marketing'),
      UTILITIES: tExpenses('utilities'),
      PACKAGING: tExpenses('packaging'),
      SHIPPING: tExpenses('shipping'),
      ADS: tExpenses('ads'),
      OTHER: tExpenses('other'),
    };
    return labels[type] || type;
  };

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: tExpenses('date'),
      width: isSmDown ? 120 : 150,
      valueGetter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'description',
      headerName: tExpenses('description'),
      width: isSmDown ? 180 : 250,
      flex: 1,
    },
    {
      field: 'type',
      headerName: tExpenses('type'),
      width: isSmDown ? 120 : 150,
      valueGetter: (value) => getTypeLabel(value),
    },
    {
      field: 'amountEUR',
      headerName: `${tExpenses('amount')} (EUR)`,
      width: isSmDown ? 120 : 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        // Handle Decimal type
        const amount = typeof params.value === 'object' && 'toNumber' in params.value
          ? params.value.toNumber()
          : params.value || 0;
        return <CurrencyDisplay amount={amount} currency="EUR" variant="body2" />;
      },
    },
    {
      field: 'amountDH',
      headerName: `${tExpenses('amount')} (DH)`,
      width: isSmDown ? 120 : 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        // Handle Decimal type
        const amount = typeof params.value === 'object' && 'toNumber' in params.value
          ? params.value.toNumber()
          : params.value || 0;
        return <CurrencyDisplay amount={amount} currency="DH" variant="body2" />;
      },
    },
    {
      field: 'shipment',
      headerName: tExpenses('shipment'),
      width: isSmDown ? 150 : 200,
      valueGetter: (value, row) => row.shipment ? row.shipment.reference : '-',
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: isSmDown ? 60 : 70,
      getActions: (params) => {
        const actions = [];
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'EXPENSES_UPDATE')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleEdit(params.row)}
              showInMenu
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
  const visibleColumns = showShipmentColumn
    ? columns
    : columns.filter((column) => column.field !== 'shipment');

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {expenses.length > 0 && (
        <TableHeader
          left={
            isAdmin && hasPermission(profile?.role || 'STAFF', 'EXPENSES_CREATE') ? (
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
            ) : null
          }
          totalCount={expenses.length}
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
                disabled={!hasPermission(profile?.role || 'STAFF', 'EXPENSES_UPDATE')}
              >
                Mark type
              </Button>
              <Menu
                anchorEl={markMenuAnchor}
                open={Boolean(markMenuAnchor)}
                onClose={() => setMarkMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                {(['OPERATIONAL', 'MARKETING', 'UTILITIES', 'PACKAGING', 'SHIPPING', 'ADS', 'OTHER'] as const).map((type) => (
                  <MenuItem key={type} onClick={() => handleBulkMarkType(type)}>
                    {getTypeLabel(type)}
                  </MenuItem>
                ))}
              </Menu>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={!hasPermission(profile?.role || 'STAFF', 'EXPENSES_DELETE')}
              >
                Delete
              </Button>
            </>
          }
        />
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
          columns={visibleColumns}
          checkboxSelection
          rowSelectionModel={selectedRows}
          onRowSelectionModelChange={setSelectedRows}
          disableRowSelectionOnClick
          columnVisibilityModel={
            isSmDown
              ? { description: false, amountEUR: false, shipment: false }
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

      <ExpenseForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setExpenseToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={expenseToEdit ? {
          id: expenseToEdit.id,
          date: expenseToEdit.date,
          amountEUR: expenseToEdit.amountEUR,
          amountDH: expenseToEdit.amountDH,
          description: expenseToEdit.description,
          type: expenseToEdit.type,
          shipmentId: expenseToEdit.shipmentId ?? expenseToEdit.arrivageId ?? undefined,
          arrivageId: expenseToEdit.arrivageId ?? undefined,
        } : undefined}
        shipments={shipments}
        exchangeRate={exchangeRate}
        defaultShipmentId={defaultShipmentId}
        hideShipmentSelect={!showShipmentColumn && Boolean(defaultShipmentId)}
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

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Expenses"
        message={`Are you sure you want to delete ${selectedRows.length} expense${selectedRows.length === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmColor="error"
        confirmLabel="Delete"
      />
    </Box>
  );
}
