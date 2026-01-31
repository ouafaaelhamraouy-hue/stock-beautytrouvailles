'use client';

import { useState, useEffect, type MouseEvent } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import {
  Box,
  Chip,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { toast } from 'sonner';
import { ProductForm } from './ProductForm';
import { ConfirmDialog } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import { QuickSale } from '@/components/sales/QuickSale';
import { StockAdjustmentDialog } from './StockAdjustmentDialog';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission, isAdmin as isAdminRole } from '@/lib/permissions';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@/hooks/useProducts';
import type { ProductFormData } from '@/lib/validations';

interface ProductTableItem {
  id: string;
  name: string;
  brand?: string | null;
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
  margin?: number;
  netMargin?: number;
  createdAt: string;
  updatedAt: string;
}

interface AvailableProduct {
  id: string;
  name: string;
  sellingPriceDh: number;
  promoPriceDh: number | null;
  purchasePriceMad: number;
  availableStock: number;
  quantityReceived: number;
  quantitySold: number;
  category: {
    name: string;
  };
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
  onRowClick?: (product: Product) => void;
  selectedProductId?: string | null;
  onAdjustStock?: (product: Product) => void;
  onResetStock?: (product: Product) => void;
  canResetStock?: boolean;
}

interface ArrivageOption {
  id: string;
  reference: string;
  source: string;
  status: string;
  purchaseDate?: string | null;
  receivedDate?: string | null;
  exchangeRate: number;
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

export function ProductsTable({
  products,
  categories,
  onRefresh,
  onRowClick,
  selectedProductId,
  onAdjustStock,
  onResetStock,
  canResetStock = false,
}: ProductsTableProps) {
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const { profile } = useUserProfile();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [adjustStockDialogOpen, setAdjustStockDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductTableItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductTableItem | null>(null);
  const [productToSell, setProductToSell] = useState<ProductTableItem | null>(null);
  const [productToAdjust, setProductToAdjust] = useState<ProductTableItem | null>(null);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>(
    selectedProductId ? [selectedProductId] : []
  );
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTargets, setAssignTargets] = useState<ProductTableItem[]>([]);
  const [selectedArrivage, setSelectedArrivage] = useState<ArrivageOption | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const isAdmin = profile ? isAdminRole(profile.role) : false;

  // Transform products to table format
  const tableProducts: ProductTableItem[] = products.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
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
    margin: p.margin,
    netMargin: p.netMargin,
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

  const { data: arrivagesData } = useQuery({
    queryKey: ['arrivages', 'list'],
    queryFn: async () => {
      const response = await fetch('/api/shipments?limit=200&sort=receivedDate');
      if (!response.ok) throw new Error('Failed to fetch arrivages');
      const data = await response.json();
      return data.shipments || [];
    },
  });

  const arrivageOptions: ArrivageOption[] = (arrivagesData || []).map((arrivage: ArrivageOption) => ({
    id: arrivage.id,
    reference: arrivage.reference,
    source: arrivage.source,
    status: arrivage.status,
    purchaseDate: arrivage.purchaseDate,
    receivedDate: arrivage.receivedDate,
    exchangeRate: Number(arrivage.exchangeRate) || 0,
  }));

  useEffect(() => {
    if (selectedProductId && selectedRows.length === 0) {
      setSelectedRows([selectedProductId]);
    }
  }, [selectedProductId, selectedRows.length]);

  const handleEdit = (product: Product) => {
    const tableProduct: ProductTableItem = {
      id: product.id,
      name: product.name,
      brand: product.brand,
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
      margin: product.margin,
      netMargin: product.netMargin,
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
      margin: product.margin,
      netMargin: product.netMargin,
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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    const url = productToEdit ? `/api/products/${productToEdit.id}` : '/api/products';
    const method = productToEdit ? 'PATCH' : 'POST';
    const payload = productToEdit
      ? (() => {
          const { quantityReceived, ...rest } = data;
          void quantityReceived;
          return rest;
        })()
      : data;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save product');
    }

    setFormOpen(false);
    setProductToEdit(null);
    onRefresh();
  };

  const handleSell = async (product: Product) => {
    // Find the product in table format
    const tableProduct = tableProducts.find(p => p.id === product.id);
    if (!tableProduct) {
      toast.error('Product not found');
      return;
    }

    // Fetch available products for QuickSale
    try {
      const response = await fetch('/api/products/available-stock');
      if (!response.ok) {
        throw new Error('Failed to fetch available products');
      }
      const data = await response.json();
      setAvailableProducts(data || []);
      setProductToSell(tableProduct);
      setSellDialogOpen(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to load products for sale');
    }
  };

  const handleSaleComplete = () => {
    setSellDialogOpen(false);
    setProductToSell(null);
    onRefresh(); // Refresh products table
  };

  const handleAddArrivage = (product: Product) => {
    const tableProduct = tableProducts.find(p => p.id === product.id);
    if (!tableProduct) {
      toast.error('Product not found');
      return;
    }
    setAssignTargets([tableProduct]);
    setSelectedArrivage(null);
    setAssignDialogOpen(true);
  };

  const handleBulkAssignOpen = () => {
    if (selectedRows.length === 0) {
      toast.info('Select products to assign');
      return;
    }
    const targets = tableProducts.filter((product) => selectedRows.includes(product.id));
    if (targets.length === 0) {
      toast.info('Select products to assign');
      return;
    }
    setAssignTargets(targets);
    setSelectedArrivage(null);
    setAssignDialogOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (!selectedArrivage) {
      toast.error('Select an arrivage');
      return;
    }
    if (assignTargets.length === 0) return;

    try {
      setAssignLoading(true);
      const results = await Promise.allSettled(
        assignTargets.map(async (product) => {
          const response = await fetch(`/api/shipments/${selectedArrivage.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to assign product');
          }
        })
      );
      const failed = results.filter((result) => result.status === 'rejected').length;
      const succeeded = results.length - failed;
      if (succeeded > 0) {
        toast.success(`Assigned ${succeeded} product${succeeded === 1 ? '' : 's'}`);
      }
      if (failed > 0) {
        toast.error(`Failed to assign ${failed} product${failed === 1 ? '' : 's'}`);
      }
      setAssignDialogOpen(false);
      setAssignTargets([]);
      setSelectedArrivage(null);
      setSelectedRows([]);
      onRefresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign products');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAdjustStock = (product: Product) => {
    if (onAdjustStock) {
      onAdjustStock(product);
    } else {
      // Fallback: use local dialog if no handler provided
      const tableProduct = tableProducts.find(p => p.id === product.id);
      if (!tableProduct) {
        toast.error('Product not found');
        return;
      }
      setProductToAdjust(tableProduct);
      setAdjustStockDialogOpen(true);
    }
  };

  const handleStockAdjustmentSuccess = () => {
    setAdjustStockDialogOpen(false);
    setProductToAdjust(null);
    onRefresh(); // Refresh products table
  };

  const columnVisibilityModel = {
    brand: !isSmDown,
    category: !isSmDown,
    purchaseSource: !isSmDown,
    purchasePriceEur: !isMdDown,
    purchasePriceMad: !isMdDown,
    promoPriceDh: !isMdDown,
    quantitySold: !isMdDown,
    margin: !isMdDown,
  };

  const showMenuActionsOnly = true;

  const columns: GridColDef<ProductTableItem>[] = [
    {
      field: 'name',
      headerName: 'Product',
      minWidth: 200,
      flex: 1,
      renderCell: (params) => (
        <Box
          sx={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: 'brand',
      headerName: 'Brand',
      minWidth: 120,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'category',
      headerName: 'Category',
      minWidth: 140,
      valueGetter: (value, row) => row.category.name,
    },
    {
      field: 'purchaseSource',
      headerName: 'Source',
      minWidth: 120,
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
      minWidth: 110,
      align: 'right',
      headerAlign: 'right',
      renderHeader: () => (
        <Tooltip title="Purchase price in EUR">
          <span>PA (EUR)</span>
        </Tooltip>
      ),
      renderCell: (params) =>
        params.value ? (
          <CurrencyDisplay amount={params.value} currency="EUR" variant="body2" />
        ) : (
          <span style={{ color: '#999' }}>-</span>
        ),
    },
    {
      field: 'purchasePriceMad',
      headerName: 'PA (MAD)',
      minWidth: 110,
      align: 'right',
      headerAlign: 'right',
      renderHeader: () => (
        <Tooltip title="Purchase price in MAD">
          <span>PA (MAD)</span>
        </Tooltip>
      ),
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
      ),
    },
    {
      field: 'sellingPriceDh',
      headerName: 'PV (DH)',
      minWidth: 110,
      align: 'right',
      headerAlign: 'right',
      renderHeader: () => (
        <Tooltip title="Selling price in DH">
          <span>PV (DH)</span>
        </Tooltip>
      ),
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
      ),
    },
    {
      field: 'promoPriceDh',
      headerName: 'Promo',
      minWidth: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) =>
        params.value ? (
          <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
        ) : (
          <span style={{ color: '#999' }}>-</span>
        ),
    },
    {
      field: 'currentStock',
      headerName: 'Stock',
      minWidth: 140,
      headerAlign: 'left',
      renderCell: (params) => {
        const stock = params.value as number;
        const product = params.row;
        const isOut = stock === 0;
        const isLow = stock > 0 && stock <= product.reorderLevel;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={isOut ? 'Rupture' : isLow ? 'Low' : 'OK'}
              color={isOut ? 'error' : isLow ? 'warning' : 'success'}
              size="small"
              sx={{ fontWeight: 600, minWidth: 70 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              {stock}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'quantitySold',
      headerName: 'Sold',
      minWidth: 90,
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'margin',
      headerName: 'Margin',
      minWidth: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const margin = params.value as number | undefined;
        if (margin === undefined) return <span style={{ color: '#999' }}>-</span>;
        return (
          <Chip
            label={`${margin.toFixed(1)}%`}
            size="small"
            color={margin >= 40 ? 'success' : margin >= 30 ? 'warning' : 'error'}
            sx={{ fontWeight: 600 }}
          />
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      minWidth: 70,
      getActions: (params) => {
        const product = products.find(p => p.id === params.id);
        if (!product) return [];

        const actions = [];
        
        // Sell action (available to all)
        actions.push(
            <GridActionsCellItem
              icon={<ShoppingCartIcon />}
              label="Sell"
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                handleSell(product);
              }}
              showInMenu={false}
            />
        );

        // Adjust Stock action (available to all - audited)
        if (hasPermission(profile?.role || 'STAFF', 'STOCK_ADJUST')) {
          actions.push(
            <GridActionsCellItem
              icon={<InventoryIcon />}
              label="Adjust Stock"
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                handleAdjustStock(product);
              }}
              showInMenu={showMenuActionsOnly}
            />
          );
        }

        if (canResetStock && onResetStock) {
          actions.push(
            <GridActionsCellItem
              icon={<RestartAltIcon />}
              label="Reset Stock"
              onClick={(e) => {
                e.stopPropagation();
                onResetStock(product);
              }}
              showInMenu={showMenuActionsOnly}
            />
          );
        }

        // Add Arrivage action
        actions.push(
          <GridActionsCellItem
            icon={<LocalShippingIcon />}
            label="Add Arrivage"
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              handleAddArrivage(product);
            }}
            showInMenu={showMenuActionsOnly}
          />
        );

        // Edit action (admin only)
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_UPDATE')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                handleEdit(product);
              }}
              showInMenu={showMenuActionsOnly}
            />
          );
        }

        // Delete action (admin only)
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_DELETE')) {
          actions.push(
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                handleDelete(product);
              }}
              showInMenu={showMenuActionsOnly}
            />
          );
        }

        return actions;
      },
    },
  ];

  // Custom toolbar without search/filter
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      {selectedRows.length > 0 && (
        <Button
          size="small"
          startIcon={<LocalShippingIcon />}
          onClick={handleBulkAssignOpen}
          sx={{ ml: 1 }}
        >
          Assign Arrivage
        </Button>
      )}
    </GridToolbarContainer>
  );

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <DataGrid
        rows={tableProducts}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        onRowClick={(params) => {
          const product = products.find(p => p.id === params.id);
          if (product && onRowClick) {
            onRowClick(product);
          }
        }}
        rowSelectionModel={selectedRows}
        onRowSelectionModelChange={setSelectedRows}
        slots={{
          toolbar: CustomToolbar,
        }}
        columnVisibilityModel={columnVisibilityModel}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25 },
          },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        density={isSmDown ? 'compact' : 'standard'}
        rowHeight={isSmDown ? 48 : 56}
        columnHeaderHeight={isSmDown ? 44 : 52}
        sx={{
          border: 'none',
          backgroundColor: 'transparent',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 0,
            backgroundColor: 'transparent',
            '&:focus': {
              outline: 'none',
            },
            '&:focus-within': {
              outline: 'none',
            },
          },
          '& .MuiDataGrid-row--striped': {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(0, 0, 0, 0.02)',
          },
          '& .MuiDataGrid-row': {
            transition: 'background-color 0.2s ease',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(17, 24, 39, 0.04)',
              cursor: 'pointer',
            },
            '&.Mui-selected': {
              backgroundColor: 'action.selected',
              '&:hover': {
                backgroundColor: 'action.selected',
              },
            },
            // Add subtle left border accent for low/out stock rows
            '&.MuiDataGrid-row--stock-low': {
              boxShadow: `inset 3px 0 0 ${theme.palette.warning.main}`,
            },
            '&.MuiDataGrid-row--stock-out': {
              boxShadow: `inset 3px 0 0 ${theme.palette.error.main}`,
            },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(15, 23, 42, 0.6)'
              : 'rgba(255, 255, 255, 0.7)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            fontWeight: 600,
            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
          },
          '& .MuiDataGrid-toolbarContainer': {
            padding: '12px 16px',
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(15, 23, 42, 0.6)'
              : 'rgba(255, 255, 255, 0.7)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            gap: 1,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-virtualScroller': {
            overflowX: 'auto',
            overscrollBehaviorX: 'contain',
          },
          '& .MuiDataGrid-virtualScrollerContent': {
            minWidth: '100%',
            width: 'max-content',
          },
          '& .MuiDataGrid-virtualScrollerRenderZone': {
            minWidth: '100%',
          },
          // Style for pinned column
          '& .MuiDataGrid-columnHeader--pinnedLeft': {
            backgroundColor: 'background.default',
          },
          '& .MuiDataGrid-cell--pinnedLeft': {
            backgroundColor: 'background.paper',
          },
        }}
        getRowClassName={(params) => {
          const classNames: string[] = [];
          const stock = params.row.currentStock;
          const reorderLevel = params.row.reorderLevel;
          if (stock === 0) classNames.push('MuiDataGrid-row--stock-out');
          if (stock > 0 && stock <= reorderLevel) classNames.push('MuiDataGrid-row--stock-low');
          if (params.indexRelativeToCurrentPage % 2 === 0) classNames.push('MuiDataGrid-row--striped');
          return classNames.join(' ');
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
          brandId: null,
          description: null,
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

      <Dialog
        open={sellDialogOpen}
        onClose={() => {
          setSellDialogOpen(false);
          setProductToSell(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Quick Sale - {productToSell?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <QuickSale
              products={availableProducts}
              onSaleComplete={handleSaleComplete}
              initialProductId={productToSell?.id}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <StockAdjustmentDialog
        open={adjustStockDialogOpen}
        onClose={() => {
          setAdjustStockDialogOpen(false);
          setProductToAdjust(null);
        }}
        productId={productToAdjust?.id || ''}
        productName={productToAdjust?.name || ''}
        currentStock={productToAdjust?.currentStock || 0}
        onSuccess={handleStockAdjustmentSuccess}
      />

      <Dialog
        open={assignDialogOpen}
        onClose={() => {
          if (assignLoading) return;
          setAssignDialogOpen(false);
          setAssignTargets([]);
          setSelectedArrivage(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign to Arrivage</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {assignTargets.length} product{assignTargets.length === 1 ? '' : 's'} selected
            </Typography>
            <Autocomplete
              options={arrivageOptions}
              value={selectedArrivage}
              onChange={(_, value) => setSelectedArrivage(value)}
              getOptionLabel={(option) => {
                const sourceLabel = PURCHASE_SOURCE_LABELS[option.source] || option.source;
                return `${option.reference} • ${sourceLabel} • ${option.status}`;
              }}
              renderInput={(params) => (
                <TextField {...params} label="Arrivage" placeholder="Select arrivage" />
              )}
            />
            {selectedArrivage && (
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.default' }}>
                <Typography variant="body2">
                  Exchange rate: {selectedArrivage.exchangeRate?.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Purchase: {selectedArrivage.purchaseDate ? new Date(selectedArrivage.purchaseDate).toLocaleDateString() : '-'}
                  {' • '}
                  Received: {selectedArrivage.receivedDate ? new Date(selectedArrivage.receivedDate).toLocaleDateString() : '-'}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (assignLoading) return;
              setAssignDialogOpen(false);
              setAssignTargets([]);
              setSelectedArrivage(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignConfirm}
            disabled={!selectedArrivage || assignLoading}
          >
            {assignLoading ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
