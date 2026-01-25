'use client';

import { useState } from 'react';
import { Typography, Box, Paper, TextField, MenuItem, Button } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductForm } from '@/components/products/ProductForm';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { SearchInput } from '@/components/ui';
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

export default function ProductsPage() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const { profile } = useUserProfile();
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const isAdmin = profile?.role === 'ADMIN';

  // Use React Query hooks for data fetching
  const { data: productsData, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts({
    limit: 100,
    categoryId: categoryFilter || undefined,
    search: searchQuery || undefined,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const products = productsData?.products || [];
  const loading = productsLoading || categoriesLoading;
  const error = productsError ? (productsError as Error).message : null;

  const handleRefresh = () => {
    refetchProducts();
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
    <Box>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
                    boxShadow: '0 4px 14px rgba(233, 30, 99, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(233, 30, 99, 0.4)',
                    },
                  }}
                >
                  {tCommon('create')} {t('products')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileUploadIcon />}
                  onClick={() => setImportDialogOpen(true)}
                  sx={(theme) => ({
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'primary.main',
                    color: theme.palette.mode === 'dark' ? '#FFFFFF' : 'primary.main',
                    '&:hover': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'primary.dark',
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(233, 30, 99, 0.08)',
                    },
                  })}
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
              sx={(theme) => ({
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'primary.main',
                color: theme.palette.mode === 'dark' ? '#FFFFFF' : 'primary.main',
                '&:hover': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'primary.dark',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(233, 30, 99, 0.08)',
                },
              })}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportExcel}
              disabled={products.length === 0}
              sx={(theme) => ({
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'primary.main',
                color: theme.palette.mode === 'dark' ? '#FFFFFF' : 'primary.main',
                '&:hover': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'primary.dark',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(233, 30, 99, 0.08)',
                },
              })}
            >
              Export Excel
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Paper 
          elevation={0}
          sx={(theme) => ({ 
            p: 3, 
            mb: 3,
            borderRadius: 2,
            background: theme.palette.mode === 'dark'
              ? theme.palette.background.paper
              : 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F8 100%)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(233, 30, 99, 0.12)',
            boxShadow: theme.palette.mode === 'dark'
              ? 'none'
              : '0 4px 20px rgba(233, 30, 99, 0.08)',
          })}
        >
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1, minWidth: 280 }}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={tCommon('search') + ' products..."'}
                fullWidth
              />
            </Box>
            <TextField
              select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ minWidth: 200 }}
              variant="outlined"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {/* Products Table or Empty State */}
        {products.length === 0 && !loading ? (
          <Paper 
            elevation={0}
            sx={(theme) => ({ 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(233, 30, 99, 0.12)',
              background: theme.palette.mode === 'dark'
                ? theme.palette.background.paper
                : 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F8 100%)',
            })}
          >
            <EmptyState
              title="No products found"
              message="Create your first product to get started"
              icon={<InventoryIcon />}
            />
          </Paper>
        ) : (
          <Paper 
            elevation={0}
            sx={(theme) => ({ 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(233, 30, 99, 0.12)',
              background: theme.palette.mode === 'dark'
                ? theme.palette.background.paper
                : 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F8 100%)',
            })}
          >
            <ProductsTable
              products={products}
              categories={categories}
              onRefresh={handleRefresh}
            />
          </Paper>
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
              
              // Show success message
              if (result.productsCreated > 0) {
                toast.success(
                  `Successfully imported ${result.arrivagesCreated} shipment(s) with ${result.productsCreated} product${result.productsCreated !== 1 ? 's' : ''}. ` +
                  (result.skipped > 0 ? `${result.skipped} skipped.` : '')
                );
              } else {
                toast.warning('No products were imported. Please check your file format.');
              }
              
              // Show errors if any
              if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
                // Log errors for debugging
                console.error('Import errors:', JSON.stringify(result.errors, null, 2));
                
                // Show detailed error message (first 3 errors)
                const errorPreview = result.errors
                  .slice(0, 3)
                  .map((err: any) => {
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
                  { duration: 10000 } // Show for 10 seconds
                );
              }
              
              handleRefresh();
            } catch (err: any) {
              console.error('Import error:', err);
              toast.error(err.message || 'Failed to import products. Please try again.');
            }
          }}
        />
    </Box>
  );
}
