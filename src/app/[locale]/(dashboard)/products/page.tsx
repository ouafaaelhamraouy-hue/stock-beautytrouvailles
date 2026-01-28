'use client';

import { useState, useEffect } from 'react';
import { Typography, Box, Paper, Button } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductDetailsPanel } from '@/components/products/ProductDetailsPanel';
import { StockAdjustmentDialog } from '@/components/products/StockAdjustmentDialog';
import { FilterCommandBar } from '@/components/products/FilterCommandBar';
import { SavedViews } from '@/components/products/SavedViews';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui';
import InventoryIcon from '@mui/icons-material/Inventory';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';
import { ImportProductsDialog } from '@/components/products/ImportProductsDialog';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Product } from '@/hooks/useProducts';
import { useRouter } from '@/i18n/routing';

export default function ProductsPage() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { profile } = useUserProfile();
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'low' | 'out' | 'ok' | ''>('');
  const [savedView, setSavedView] = useState<string>('all');
  
  // UI state
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [adjustStockDialogOpen, setAdjustStockDialogOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);

  const isAdmin = profile?.role === 'ADMIN';

  // Apply saved view filters
  useEffect(() => {
    if (savedView === 'low') {
      setStockFilter('low');
      setSearchQuery('');
      setCategoryFilter('');
      setSourceFilter('');
    } else if (savedView === 'out') {
      setStockFilter('out');
      setSearchQuery('');
      setCategoryFilter('');
      setSourceFilter('');
    } else if (savedView === 'promo') {
      // Promo filter would need to be added to API
      setStockFilter('');
      setSearchQuery('');
      setCategoryFilter('');
      setSourceFilter('');
    } else {
      // 'all' view - keep current filters but reset stock
      setStockFilter('');
    }
  }, [savedView]);

  // Use React Query hooks for data fetching
  const { data: productsData, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts({
    limit: 100,
    categoryId: categoryFilter || undefined,
    search: searchQuery || undefined,
    source: sourceFilter || undefined,
    stock: stockFilter || undefined,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const products = productsData?.products || [];
  const loading = productsLoading || categoriesLoading;
  const error = productsError ? (productsError as Error).message : null;

  const handleRefresh = () => {
    refetchProducts();
  };

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setSelectedProduct(null);
  };

  const handleEdit = (product: Product) => {
    // TODO: Open edit form
    toast.info(`Edit ${product.name} - to be implemented`);
  };

  const handleSell = (product: Product) => {
    router.push(`/quick-sale?productId=${product.id}`);
  };

  const handleAddArrivage = (product: Product) => {
    router.push(`/shipments?productId=${product.id}`);
  };

  const handleViewHistory = (product: Product) => {
    router.push(`/products/${product.id}/history`);
  };

  const handleAdjustStock = (product: Product) => {
    setProductToAdjust(product);
    setAdjustStockDialogOpen(true);
  };

  const handleStockAdjustmentSuccess = () => {
    setAdjustStockDialogOpen(false);
    setProductToAdjust(null);
    handleRefresh();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setSourceFilter('');
    setStockFilter('');
    setSavedView('all');
  };

  const handleExportExcel = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }

    try {
      const excelData = products.map((p) => ({
        Name: p.name,
        Brand: p.brand || '',
        Category: p.category,
        Source: p.purchaseSource,
        'PA (EUR)': p.purchasePriceEur || '',
        'PA (MAD)': p.purchasePriceMad,
        'PV (DH)': p.sellingPriceDh,
        'Promo (DH)': p.promoPriceDh || '',
        'Margin %': p.margin,
        'Net Margin %': p.netMargin,
        'Quantity Received': p.quantityReceived,
        'Quantity Sold': p.quantitySold,
        'Current Stock': p.currentStock,
        'Reorder Level': p.reorderLevel,
        'Created At': new Date(p.createdAt).toLocaleDateString(),
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      XLSX.writeFile(wb, `products-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Products exported to Excel');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export to Excel');
    }
  };

  if (loading && products.length === 0) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          {t('products')}
        </Typography>
        <LoadingState variant="table" rows={5} />
      </Box>
    );
  }

  if (error && products.length === 0) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          {t('products')}
        </Typography>
        <ErrorState message={error} onRetry={handleRefresh} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {t('products')}
        </Typography>
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_CREATE') && (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateFormOpen(true)}
                sx={{
                  boxShadow: '0 4px 14px rgba(212, 20, 90, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(212, 20, 90, 0.4)',
                  },
                }}
              >
                {tCommon('create')} {t('products')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileUploadIcon />}
                onClick={() => setImportDialogOpen(true)}
              >
                Import CSV/Excel
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            disabled={products.length === 0}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      {/* Saved Views */}
      <SavedViews activeView={savedView} onViewChange={setSavedView} />

      {/* Two-Pane Layout */}
      <Box sx={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', minHeight: 0 }}>
        {/* Left Pane - Table */}
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            minWidth: 0, 
            overflow: 'hidden',
            transition: 'margin-right 0.3s ease',
            mr: { md: panelOpen ? '400px' : 0 },
          }}
        >
          {/* Filter Command Bar */}
          <FilterCommandBar
            search={searchQuery}
            category={categoryFilter}
            source={sourceFilter}
            stock={stockFilter}
            categories={categories}
            onSearchChange={setSearchQuery}
            onCategoryChange={setCategoryFilter}
            onSourceChange={setSourceFilter}
            onStockChange={setStockFilter}
            onReset={handleResetFilters}
          />

          {/* Products Table */}
          {products.length === 0 && !loading ? (
            <Paper 
              elevation={0}
              sx={(theme) => ({ 
                flex: 1,
                borderRadius: 0,
                border: 'none',
                borderTop: '1px solid',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <EmptyState
                title="No products found"
                message={searchQuery || categoryFilter || sourceFilter || stockFilter 
                  ? "Try adjusting your filters" 
                  : "Create your first product to get started"}
                icon={<InventoryIcon />}
              />
            </Paper>
          ) : (
            <Paper 
              elevation={0}
              sx={(theme) => ({ 
                flex: 1,
                borderRadius: 0,
                border: 'none',
                borderTop: '1px solid',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              })}
            >
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <ProductsTable
                  products={products}
                  categories={categories}
                  onRefresh={handleRefresh}
                  onRowClick={handleRowClick}
                  selectedProductId={selectedProduct?.id || null}
                  onAdjustStock={handleAdjustStock}
                />
              </Box>
            </Paper>
          )}
        </Box>

        {/* Right Pane - Product Details Panel */}
        <ProductDetailsPanel
          product={selectedProduct}
          open={panelOpen}
          onClose={handleClosePanel}
          onEdit={handleEdit}
          onSell={handleSell}
          onAddArrivage={handleAddArrivage}
          onViewHistory={handleViewHistory}
          onAdjustStock={handleAdjustStock}
        />
      </Box>

      {/* Stock Adjustment Dialog */}
      {productToAdjust && (
        <StockAdjustmentDialog
          open={adjustStockDialogOpen}
          onClose={() => {
            setAdjustStockDialogOpen(false);
            setProductToAdjust(null);
          }}
          productId={productToAdjust.id}
          productName={productToAdjust.name}
          currentStock={productToAdjust.currentStock}
          onSuccess={handleStockAdjustmentSuccess}
        />
      )}

      {/* Product Form */}
      <ProductForm
        open={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSubmit={async (data) => {
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create product');
          }

          setCreateFormOpen(false);
          handleRefresh();
        }}
        categories={categories}
      />

      {/* Import Products Dialog */}
      <ImportProductsDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={async (importData) => {
          try {
            const response = await fetch('/api/products/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(importData),
            });

            if (!response.ok) {
              const errorData = await response.json();
              toast.error(errorData.error || 'Failed to import products');
              return;
            }

            const result = await response.json();
            
            if (result.productsCreated > 0) {
              toast.success(
                `Successfully imported ${result.arrivagesCreated} shipment(s) with ${result.productsCreated} product${result.productsCreated !== 1 ? 's' : ''}. ` +
                (result.skipped > 0 ? `${result.skipped} skipped.` : '')
              );
            } else {
              toast.warning('No products were imported. Please check your file format.');
            }
            
            if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
              console.error('Import errors:', JSON.stringify(result.errors, null, 2));
              
              type ImportError = { product?: string; sheet?: string; error?: string };
              const errorPreview = (result.errors as ImportError[])
                .slice(0, 3)
                .map((err) => {
                  const productName = err.product && err.product !== 'N/A' ? err.product : 'Unknown product';
                  const sheetName = err.sheet && err.sheet !== 'N/A' ? err.sheet : 'Unknown sheet';
                  return `• ${productName} (${sheetName}): ${err.error || 'Unknown error'}`;
                })
                .join('\n');
              
              const errorCount = result.errors.length;
              const errorMessage = errorCount > 3
                ? `${errorPreview}\n... and ${errorCount - 3} more error${errorCount - 3 !== 1 ? 's' : ''}`
                : errorPreview;
              
              toast.error(
                `${errorCount} error${errorCount !== 1 ? 's' : ''} occurred:\n${errorMessage}`,
                { duration: 10000 }
              );
            }
            
            handleRefresh();
          } catch (err: unknown) {
            console.error('Import error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to import products. Please try again.');
          }
        }}
      />
    </Box>
  );
}
