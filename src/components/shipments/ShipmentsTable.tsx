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
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LabelIcon from '@mui/icons-material/Label';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';
import { ShipmentForm } from './ShipmentForm';
import { BulkActionBar, ConfirmDialog, TableHeader } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission, isAdmin as isAdminRole } from '@/lib/permissions';
import type { ShipmentFormData } from '@/lib/validations';

type StatusTone = 'success' | 'error' | 'warning' | 'info' | 'default';

interface Shipment {
  id: string;
  reference: string;
  source: ShipmentFormData['source'];
  purchaseDate?: string | null;
  shipDate?: string | null;
  receivedDate?: string | null;
  status: 'PENDING' | 'PURCHASED' | 'SHIPPED' | 'IN_TRANSIT' | 'CUSTOMS' | 'RECEIVED';
  exchangeRate: number;
  shippingCostEUR: number;
  packagingCostEUR: number;
  totalCostEUR: number;
  totalCostDH: number;
  createdAt: string;
  updatedAt: string;
  calculatedTotals?: {
    itemsCostEUR: number;
    totalCostEUR: number;
    totalCostDH: number;
    totalRevenueEUR: number;
    totalRevenueDH: number;
    profitEUR: number;
    profitDH: number;
    marginPercent: number;
  };
}

interface ShipmentsTableProps {
  shipments: Shipment[];
  onRefresh: () => void;
}

const PURCHASE_SOURCE_LABELS: Record<string, string> = {
  ACTION: 'Action',
  RITUALS: 'Rituals',
  NOCIBE: 'Nocibé',
  LIDL: 'Lidl',
  CARREFOUR: 'Carrefour',
  PHARMACIE: 'Pharmacie',
  AMAZON_FR: 'Amazon FR',
  SEPHORA: 'Sephora',
  OTHER: 'Other',
};

export function ShipmentsTable({ shipments, onRefresh }: ShipmentsTableProps) {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const tShipments = useTranslations('shipments');
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const { profile } = useUserProfile();
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [markMenuAnchor, setMarkMenuAnchor] = useState<null | HTMLElement>(null);
  const [shipmentToEdit, setShipmentToEdit] = useState<Shipment | null>(null);
  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(null);

  const isAdmin = profile ? isAdminRole(profile.role) : false;

  const handleCreate = () => {
    setShipmentToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (shipment: Shipment) => {
    setShipmentToEdit(shipment);
    setFormOpen(true);
  };

  const handleView = (shipment: Shipment) => {
    router.push(`/shipments/${shipment.id}`);
  };

  const handleDelete = (shipment: Shipment) => {
    setShipmentToDelete(shipment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!shipmentToDelete) return;

    try {
      const response = await fetch(`/api/shipments/${shipmentToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete shipment');
      }

      toast.success('Shipment deleted successfully');
      setDeleteDialogOpen(false);
      setShipmentToDelete(null);
      onRefresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete shipment');
    }
  };

  const handleFormSubmit = async (data: ShipmentFormData & { status: string }) => {
    const url = shipmentToEdit ? `/api/shipments/${shipmentToEdit.id}` : '/api/shipments';
    const method = shipmentToEdit ? 'PUT' : 'POST';

    // Map form data to API format
    const apiData = {
      reference: data.reference,
      source: data.source,
      purchaseDate: data.purchaseDate,
      shipDate: data.shipDate,
      receivedDate: data.receivedDate,
      status: data.status,
      exchangeRate: data.exchangeRate,
      shippingCostEur: data.shippingCostEUR,
      packagingCostEur: data.packagingCostEUR,
      totalCostEur: data.totalCostEUR,
    };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save shipment');
    }

    const result = await response.json();
    toast.success(shipmentToEdit ? 'Shipment updated successfully' : 'Shipment created successfully');
    setFormOpen(false);
    setShipmentToEdit(null);
    onRefresh();
    if (!shipmentToEdit && result?.id) {
      router.push(`/shipments/${result.id}`);
    }
  };

  const handleBulkExport = async () => {
    if (selectedRows.length === 0) return;
    const XLSX = await import('xlsx');
    const selected = shipments.filter((shipment) => selectedRows.includes(shipment.id));
    const excelData = selected.map((shipment) => ({
      Reference: shipment.reference,
      Source: PURCHASE_SOURCE_LABELS[shipment.source] || shipment.source,
      Status: getStatusLabel(shipment.status),
      'Received Date': shipment.receivedDate ? new Date(shipment.receivedDate).toLocaleDateString() : '-',
      'Total Cost (EUR)': shipment.totalCostEUR,
      'Total Cost (DH)': shipment.totalCostDH,
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Shipments');
    XLSX.writeFile(wb, `shipments-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Selected shipments exported');
  };

  const handleBulkMarkStatus = async (status: Shipment['status']) => {
    if (selectedRows.length === 0) return;
    const ids = selectedRows.map((id) => String(id));
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const response = await fetch(`/api/shipments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!response.ok) {
          throw new Error('Failed to update shipment');
        }
      })
    );
    const failed = results.filter((result) => result.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) {
      toast.success(`Updated ${succeeded} shipment${succeeded === 1 ? '' : 's'}`);
    }
    if (failed > 0) {
      toast.error(`Failed to update ${failed} shipment${failed === 1 ? '' : 's'}`);
    }
    setMarkMenuAnchor(null);
    onRefresh();
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedRows.length === 0) return;
    const ids = selectedRows.map((id) => String(id));
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const response = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete shipment');
        }
      })
    );
    const failed = results.filter((result) => result.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) {
      toast.success(`Deleted ${succeeded} shipment${succeeded === 1 ? '' : 's'}`);
    }
    if (failed > 0) {
      toast.error(`Failed to delete ${failed} shipment${failed === 1 ? '' : 's'}`);
    }
    setBulkDeleteDialogOpen(false);
    setSelectedRows([]);
    onRefresh();
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      PURCHASED: 'Purchased',
      SHIPPED: 'Shipped',
      IN_TRANSIT: 'In Transit',
      CUSTOMS: 'Customs',
      RECEIVED: 'Received',
    };
    return labels[status] || status;
  };

  const getStatusTone = (status: string): StatusTone => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'PURCHASED':
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'info';
      case 'CUSTOMS':
        return 'warning';
      case 'RECEIVED':
        return 'success';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'reference', headerName: tShipments('reference'), width: isSmDown ? 130 : 150, flex: 0 },
    {
      field: 'source',
      headerName: 'Purchase Source',
      width: isSmDown ? 150 : 200,
      flex: 1,
      valueGetter: (value, row) => PURCHASE_SOURCE_LABELS[row.source] || row.source,
    },
    {
      field: 'status',
      headerName: tShipments('status'),
      width: isSmDown ? 110 : 130,
      renderCell: (params) => (
        <StatusBadge label={getStatusLabel(params.value)} status={getStatusTone(params.value)} />
      ),
    },
    {
      field: 'receivedDate',
      headerName: tShipments('receivedDate'),
      width: isSmDown ? 130 : 150,
      valueGetter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'totalCostEUR',
      headerName: tShipments('totalCost') + ' (EUR)',
      width: isSmDown ? 120 : 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="EUR" variant="body2" />
      ),
    },
    {
      field: 'totalCostDH',
      headerName: tShipments('totalCost') + ' (DH)',
      width: isSmDown ? 120 : 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
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
            icon={<VisibilityIcon />}
            label="View"
            onClick={() => handleView(params.row)}
            showInMenu
          />
        );
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'ARRIVAGES_UPDATE')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleEdit(params.row)}
              showInMenu
            />
          );
        }
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'ARRIVAGES_DELETE')) {
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
      {shipments.length > 0 && (
        <TableHeader
          left={
            isAdmin && hasPermission(profile?.role || 'STAFF', 'ARRIVAGES_CREATE') ? (
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
                {t('create')} {tNav('shipments')}
              </Button>
            ) : null
          }
          totalCount={shipments.length}
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
                disabled={!hasPermission(profile?.role || 'STAFF', 'ARRIVAGES_UPDATE')}
              >
                Mark status
              </Button>
              <Menu
                anchorEl={markMenuAnchor}
                open={Boolean(markMenuAnchor)}
                onClose={() => setMarkMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <MenuItem onClick={() => handleBulkMarkStatus('IN_TRANSIT')}>In Transit</MenuItem>
                <MenuItem onClick={() => handleBulkMarkStatus('CUSTOMS')}>Customs</MenuItem>
                <MenuItem onClick={() => handleBulkMarkStatus('RECEIVED')}>Received</MenuItem>
              </Menu>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={!hasPermission(profile?.role || 'STAFF', 'ARRIVAGES_DELETE')}
              >
                Delete
              </Button>
            </>
          }
        />
      )}

      {shipments.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <p>No shipments found. Create your first shipment.</p>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'ARRIVAGES_CREATE') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ mt: 2 }}
            >
              {t('create')} {tNav('shipments')}
            </Button>
          )}
        </Box>
      ) : (
        <DataGrid
          rows={shipments}
          columns={columns}
          checkboxSelection={isAdmin}
          rowSelectionModel={selectedRows}
          onRowSelectionModelChange={setSelectedRows}
          disableRowSelectionOnClick
          columnVisibilityModel={
            isSmDown
              ? { source: false, receivedDate: false, totalCostEUR: false }
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

      <ShipmentForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setShipmentToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={shipmentToEdit ? {
          id: shipmentToEdit.id,
          reference: shipmentToEdit.reference,
          source: shipmentToEdit.source,
          purchaseDate: shipmentToEdit.purchaseDate,
          shipDate: shipmentToEdit.shipDate,
          receivedDate: shipmentToEdit.receivedDate,
          status: shipmentToEdit.status,
          exchangeRate: shipmentToEdit.exchangeRate,
          shippingCostEUR: shipmentToEdit.shippingCostEUR,
          packagingCostEUR: shipmentToEdit.packagingCostEUR,
          totalCostEUR: shipmentToEdit.totalCostEUR,
        } : undefined}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setShipmentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Shipment"
        message={`Are you sure you want to delete shipment "${shipmentToDelete?.reference}"? This action cannot be undone.`}
        confirmColor="error"
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Shipments"
        message={`Are you sure you want to delete ${selectedRows.length} shipment${selectedRows.length === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmColor="error"
        confirmLabel="Delete"
      />
    </Box>
  );
}
