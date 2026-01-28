'use client';

import { useState } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridToolbar,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
} from '@mui/x-data-grid';
import { Box, Chip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import { toast } from 'sonner';
import { ProductForm } from './ProductForm';
import { ConfirmDialog } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import { QuickSale } from '@/components/sales/QuickSale';
import { StockAdjustmentDialog } from './StockAdjustmentDialog';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';
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
}: ProductsTableProps) {
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
  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN';

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
    // TODO: Open add arrivage dialog/modal
    toast.info(`Add arrivage for ${product.name} - to be implemented`);
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

  const columns: GridColDef<ProductTableItem>[] = [
    {
      field: 'name',
      headerName: 'Product',
      width: 250,
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
      width: 120,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'category',
      headerName: 'Category',
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
      width: 110,
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
      width: 110,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
      ),
    },
    {
      field: 'sellingPriceDh',
      headerName: 'PV (DH)',
      width: 110,
      renderCell: (params) => (
        <CurrencyDisplay amount={params.value} currency="DH" variant="body2" />
      ),
    },
    {
      field: 'promoPriceDh',
      headerName: 'Promo',
      width: 110,
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
      width: 120,
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
      width: 100,
    },
    {
      field: 'margin',
      headerName: 'Margin',
      width: 100,
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
      width: 140,
      getActions: (params) => {
        const product = products.find(p => p.id === params.id);
        if (!product) return [];

        const actions = [];
        
        // Sell action (available to all)
        actions.push(
          <GridActionsCellItem
            icon={<ShoppingCartIcon />}
            label="Sell"
            onClick={(e) => {
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
              onClick={(e) => {
                e.stopPropagation();
                handleAdjustStock(product);
              }}
              showInMenu={false}
            />
          );
        }

        // Add Arrivage action
        actions.push(
          <GridActionsCellItem
            icon={<LocalShippingIcon />}
            label="Add Arrivage"
            onClick={(e) => {
              e.stopPropagation();
              handleAddArrivage(product);
            }}
            showInMenu={false}
          />
        );

        // Edit action (admin only)
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_UPDATE')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(product);
              }}
              showInMenu={false}
            />
          );
        }

        // Delete action (admin only)
        if (isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_DELETE')) {
          actions.push(
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(product);
              }}
              showInMenu
            />
          );
        }

        return actions;
      },
    },
  ];

  // Custom toolbar without search/filter
  const CustomToolbar = () => (
    <GridToolbar>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
    </GridToolbar>
  );

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <DataGrid
        rows={tableProducts}
        columns={columns}
        disableRowSelectionOnClick={false}
        onRowClick={(params) => {
          const product = products.find(p => p.id === params.id);
          if (product && onRowClick) {
            onRowClick(product);
          }
        }}
        rowSelectionModel={selectedProductId ? [selectedProductId] : []}
        slots={{
          toolbar: CustomToolbar,
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
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:focus': {
              outline: 'none',
            },
            '&:focus-within': {
              outline: 'none',
            },
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: 'action.hover',
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
              borderLeft: '3px solid',
              borderColor: 'warning.main',
            },
            '&.MuiDataGrid-row--stock-out': {
              borderLeft: '3px solid',
              borderColor: 'error.main',
            },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider',
            fontWeight: 600,
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
          // Style for pinned column
          '& .MuiDataGrid-columnHeader--pinnedLeft': {
            backgroundColor: 'background.default',
          },
          '& .MuiDataGrid-cell--pinnedLeft': {
            backgroundColor: 'background.paper',
          },
        }}
        getRowClassName={(params) => {
          const stock = params.row.currentStock;
          const reorderLevel = params.row.reorderLevel;
          if (stock === 0) return 'MuiDataGrid-row--stock-out';
          if (stock <= reorderLevel) return 'MuiDataGrid-row--stock-low';
          return '';
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
    </Box>
  );
}
