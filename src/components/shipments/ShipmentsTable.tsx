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
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';
import { ShipmentForm } from './ShipmentForm';
import { ConfirmDialog } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';
import type { ShipmentFormData } from '@/lib/validations';

type StatusTone = 'success' | 'error' | 'warning' | 'info' | 'default';

interface Shipment {
  id: string;
  reference: string;
  source: string;
  arrivalDate?: string | null;
  status: 'PENDING' | 'IN_TRANSIT' | 'ARRIVED' | 'PROCESSED';
  exchangeRate: number;
  shippingCostEUR: number;
  customsCostEUR: number;
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
  const { profile } = useUserProfile();
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shipmentToEdit, setShipmentToEdit] = useState<Shipment | null>(null);
  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(null);

  const isAdmin = profile?.role === 'ADMIN';

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
      arrivalDate: data.arrivalDate,
      status: data.status,
      exchangeRate: data.exchangeRate,
      shippingCostEur: data.shippingCostEUR,
      customsCostEUR: data.customsCostEUR,
      packagingCostEur: data.packagingCostEUR,
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

    toast.success(shipmentToEdit ? 'Shipment updated successfully' : 'Shipment created successfully');
    setFormOpen(false);
    setShipmentToEdit(null);
    onRefresh();
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      IN_TRANSIT: 'In Transit',
      ARRIVED: 'Arrived',
      PROCESSED: 'Processed',
    };
    return labels[status] || status;
  };

  const getStatusTone = (status: string): StatusTone => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'IN_TRANSIT':
        return 'info';
      case 'ARRIVED':
      case 'PROCESSED':
        return 'success';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'reference', headerName: tShipments('reference'), width: 150, flex: 0 },
    {
      field: 'source',
      headerName: 'Purchase Source',
      width: 200,
      flex: 1,
      valueGetter: (value, row) => PURCHASE_SOURCE_LABELS[row.source] || row.source,
    },
    {
      field: 'status',
      headerName: tShipments('status'),
      width: 130,
      renderCell: (params) => (
        <StatusBadge label={getStatusLabel(params.value)} status={getStatusTone(params.value)} />
      ),
    },
    {
      field: 'arrivalDate',
      headerName: tShipments('arrivalDate'),
      width: 150,
      valueGetter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'totalCostEUR',
      headerName: tShipments('totalCost') + ' (EUR)',
      width: 150,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="EUR" variant="body2" />
      ),
    },
    {
      field: 'totalCostDH',
      headerName: tShipments('totalCost') + ' (DH)',
      width: 150,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
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
            icon={<VisibilityIcon />}
            label="View"
            onClick={() => handleView(params.row)}
          />
        );
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'SHIPMENTS_UPDATE')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleEdit(params.row)}
            />
          );
        }
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'SHIPMENTS_DELETE')) {
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
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'SHIPMENTS_CREATE') && (
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
          )}
        </Box>
      )}

      {shipments.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <p>No shipments found. Create your first shipment.</p>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'SHIPMENTS_CREATE') && (
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

      <ShipmentForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setShipmentToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={shipmentToEdit || undefined}
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
    </Box>
  );
}
