'use client';

import { useState, useEffect, useMemo, type MouseEvent } from 'react';
import { Typography, Box, Paper, Button, Stack, Menu, MenuItem, IconButton, Tooltip, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslations } from 'next-intl';
import { ProductsTable } from '@/components/products/ProductsTable';
import { FilterCommandBar } from '@/components/products/FilterCommandBar';
import { SavedViews } from '@/components/products/SavedViews';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import RefreshIcon from '@mui/icons-material/Refresh';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission, isAdmin as isAdminRole, isSuperAdmin } from '@/lib/permissions';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Product } from '@/hooks/useProducts';
import { useRouter } from '@/i18n/routing';
import dynamic from 'next/dynamic';
import { QuickSale, type QuickSaleProduct } from '@/components/sales/QuickSale';

const ProductForm = dynamic(
  () => import('@/components/products/ProductForm').then((mod) => mod.ProductForm),
  { ssr: false }
);
const ProductDetailsPanel = dynamic(
  () => import('@/components/products/ProductDetailsPanel').then((mod) => mod.ProductDetailsPanel),
  { ssr: false }
);
const StockAdjustmentDialog = dynamic(
  () => import('@/components/products/StockAdjustmentDialog').then((mod) => mod.StockAdjustmentDialog),
  { ssr: false }
);
const ResetStockDialog = dynamic(
  () => import('@/components/products/ResetStockDialog').then((mod) => mod.ResetStockDialog),
  { ssr: false }
);
const ImportProductsDialog = dynamic(
  () => import('@/components/products/ImportProductsDialog').then((mod) => mod.ImportProductsDialog),
  { ssr: false }
);

export default function ProductsPage() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { profile } = useUserProfile();
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
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
  const [resetStockDialogOpen, setResetStockDialogOpen] = useState(false);
  const [productToReset, setProductToReset] = useState<Product | null>(null);
  const [moreActionsAnchor, setMoreActionsAnchor] = useState<null | HTMLElement>(null);
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const [quickSaleProduct, setQuickSaleProduct] = useState<Product | null>(null);
  const [quickSaleProducts, setQuickSaleProducts] = useState<QuickSaleProduct[]>([]);
  const [quickSaleLoading, setQuickSaleLoading] = useState(false);

  const isAdmin = profile ? isAdminRole(profile.role) : false;
  const canResetStock = profile ? isSuperAdmin(profile.role) : false;

  // Apply saved view filters
  useEffect(() => {
    if (savedView === 'low') {
      setStockFilter('low');
      setSearchQuery('');
      setSearchInput('');
      setCategoryFilter('');
      setSourceFilter('');
    } else if (savedView === 'out') {
      setStockFilter('out');
      setSearchQuery('');
      setSearchInput('');
      setCategoryFilter('');
      setSourceFilter('');
    } else if (savedView === 'promo') {
      // Promo filter would need to be added to API
      setStockFilter('');
      setSearchQuery('');
      setSearchInput('');
      setCategoryFilter('');
      setSourceFilter('');
    } else {
      // 'all' view - keep current filters but reset stock
      setStockFilter('');
    }
  }, [savedView]);

  // Debounce search input to avoid chatty queries
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  // Use React Query hooks for data fetching
  const { data: productsData, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts({
    limit: 100,
    categoryId: categoryFilter || undefined,
    search: searchQuery || undefined,
    source: sourceFilter || undefined,
    stock: stockFilter || undefined,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const products = useMemo<Product[]>(() => productsData?.products ?? [], [productsData?.products]);
  const loading = productsLoading || categoriesLoading;
  const error = productsError ? (productsError as Error).message : null;

  const promoFilteredProducts = useMemo(() => {
    if (savedView !== 'promo') return products;
    return products.filter((product) => !!product.promoPriceDh);
  }, [products, savedView]);

  const stats = useMemo(() => {
    const total = products.length;
    const out = products.filter((product) => product.currentStock === 0).length;
    const low = products.filter(
      (product) => product.currentStock > 0 && product.currentStock <= product.reorderLevel
    ).length;
    const promo = products.filter((product) => !!product.promoPriceDh).length;
    return { total, out, low, promo };
  }, [products]);

  const avgMargin = useMemo(() => {
    const margins = products
      .map((product) => product.margin)
      .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
    if (margins.length === 0) return null;
    return margins.reduce((sum, value) => sum + value, 0) / margins.length;
  }, [products]);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total products',
        value: stats.total,
        subtext: stats.total === 1 ? '1 active item' : `${stats.total} active items`,
        icon: <InventoryIcon fontSize="small" />,
        color: '#D4145A',
      },
      {
        label: 'Low stock',
        value: stats.low,
        subtext: stats.low === 0 ? 'All healthy' : 'Reorder triggered',
        icon: <WarningAmberIcon fontSize="small" />,
        color: '#F59E0B',
      },
      {
        label: 'Out of stock',
        value: stats.out,
        subtext: stats.out === 0 ? 'No outages' : 'Needs attention',
        icon: <ReportProblemIcon fontSize="small" />,
        color: '#EF4444',
      },
      {
        label: 'Promo items',
        value: stats.promo,
        subtext: stats.promo === 0 ? 'No active promos' : 'Live promotions',
        icon: <LocalOfferIcon fontSize="small" />,
        color: '#6366F1',
      },
      {
        label: 'Avg margin',
        value: avgMargin === null ? '—' : `${avgMargin.toFixed(1)}%`,
        subtext: avgMargin === null ? 'No margin data' : 'Across catalog',
        icon: <TrendingUpIcon fontSize="small" />,
        color: '#10B981',
      },
    ],
    [avgMargin, stats]
  );

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

  const handleSell = async (product: Product) => {
    try {
      setQuickSaleLoading(true);
      const response = await fetch('/api/products/available-stock');
      if (!response.ok) {
        throw new Error('Failed to fetch available products');
      }
      const data = await response.json();
      setQuickSaleProducts(data || []);
      setQuickSaleProduct(product);
      setQuickSaleOpen(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to load products for sale');
    } finally {
      setQuickSaleLoading(false);
    }
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

  const handleResetStock = (product: Product) => {
    setProductToReset(product);
    setResetStockDialogOpen(true);
  };

  const handleStockAdjustmentSuccess = () => {
    setAdjustStockDialogOpen(false);
    setProductToAdjust(null);
    handleRefresh();
  };

  const handleQuickSaleClose = () => {
    setQuickSaleOpen(false);
    setQuickSaleProduct(null);
  };

  const handleQuickSaleComplete = () => {
    handleQuickSaleClose();
    handleRefresh();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchInput('');
    setCategoryFilter('');
    setSourceFilter('');
    setStockFilter('');
    setSavedView('all');
  };

  const handleOpenMoreActions = (event: MouseEvent<HTMLElement>) => {
    setMoreActionsAnchor(event.currentTarget);
  };

  const handleCloseMoreActions = () => {
    setMoreActionsAnchor(null);
  };

  const handleExportExcel = async () => {
    if (promoFilteredProducts.length === 0) {
      toast.error('No products to export');
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const excelData = promoFilteredProducts.map((p: Product) => ({
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
    <Box
      sx={(theme) => ({
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
        background: theme.palette.mode === 'dark'
          ? 'radial-gradient(circle at 10% 10%, rgba(212, 20, 90, 0.12), transparent 45%), radial-gradient(circle at 90% 20%, rgba(99, 102, 241, 0.12), transparent 45%)'
          : 'radial-gradient(circle at 10% 10%, rgba(212, 20, 90, 0.08), transparent 45%), radial-gradient(circle at 90% 20%, rgba(99, 102, 241, 0.08), transparent 45%)',
      })}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            mb: 2.5,
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(0, 0, 0, 0.08)',
            backgroundColor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.7)
              : alpha(theme.palette.common.white, 0.7),
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 50px rgba(0, 0, 0, 0.35)'
              : '0 20px 50px rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          })}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {t('products')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 520 }}>
                Track your catalog, pricing, and stock health at a glance.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Box sx={(theme) => ({
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 999,
                  bgcolor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.common.white, 0.6),
                  border: '1px solid',
                  borderColor: 'divider',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                })}>
                  Total: {stats.total}
                </Box>
                <Box sx={(theme) => ({ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: alpha(theme.palette.warning.light, 0.12), border: '1px solid', borderColor: 'warning.main', color: 'warning.main', fontSize: '0.8125rem', fontWeight: 600 })}>
                  Low: {stats.low}
                </Box>
                <Box sx={(theme) => ({ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: alpha(theme.palette.error.light, 0.12), border: '1px solid', borderColor: 'error.main', color: 'error.main', fontSize: '0.8125rem', fontWeight: 600 })}>
                  Out: {stats.out}
                </Box>
                <Box sx={(theme) => ({ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: alpha(theme.palette.primary.light, 0.12), border: '1px solid', borderColor: 'primary.main', color: 'primary.main', fontSize: '0.8125rem', fontWeight: 600 })}>
                  Promo: {stats.promo}
                </Box>
              </Stack>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} size="small" sx={{ bgcolor: 'action.hover' }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_CREATE') && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateFormOpen(true)}
                  sx={{
                    boxShadow: '0 6px 18px rgba(212, 20, 90, 0.3)',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(212, 20, 90, 0.4)',
                    },
                  }}
                >
                  {tCommon('create')} {t('products')}
                </Button>
              )}
              <Button
                variant="outlined"
                endIcon={<MoreHorizIcon />}
                onClick={handleOpenMoreActions}
                sx={(theme) => ({
                  whiteSpace: 'nowrap',
                  borderColor: alpha(theme.palette.text.primary, 0.16),
                  color: 'text.primary',
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.6)
                    : alpha(theme.palette.common.white, 0.4),
                  '&:hover': {
                    borderColor: alpha(theme.palette.text.primary, 0.32),
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : alpha(theme.palette.common.white, 0.6),
                  },
                })}
              >
                More actions
              </Button>
              <Menu
                anchorEl={moreActionsAnchor}
                open={Boolean(moreActionsAnchor)}
                onClose={handleCloseMoreActions}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_CREATE') && (
                  <MenuItem
                    onClick={() => {
                      setImportDialogOpen(true);
                      handleCloseMoreActions();
                    }}
                  >
                    <FileUploadIcon fontSize="small" style={{ marginRight: 8 }} />
                    Import CSV/Excel
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    handleExportExcel();
                    handleCloseMoreActions();
                  }}
                  disabled={promoFilteredProducts.length === 0}
                >
                  <FileDownloadIcon fontSize="small" style={{ marginRight: 8 }} />
                  Export Excel
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Paper>

        {/* Summary Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 2,
            mb: 2.5,
          }}
        >
          {summaryCards.map((card) => (
            <Paper
              key={card.label}
              elevation={0}
              sx={(theme) => ({
                p: 2.25,
                borderRadius: 3,
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.6)
                  : alpha(theme.palette.common.white, 0.75),
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 16px 40px rgba(0, 0, 0, 0.35)'
                  : '0 16px 40px rgba(15, 23, 42, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                minHeight: 120,
              })}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'text.secondary',
                    fontWeight: 600,
                  }}
                >
                  {card.label}
                </Typography>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${card.color}1A`,
                    color: card.color,
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: 'text.primary', fontFeatureSettings: '"tnum"' }}
              >
                {card.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {card.subtext}
              </Typography>
            </Paper>
          ))}
        </Box>

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
            }}
          >
            <Paper
              elevation={0}
              sx={(theme) => ({
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                borderRadius: 3,
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.65)
                  : alpha(theme.palette.common.white, 0.72),
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 18px 45px rgba(0, 0, 0, 0.35)'
                  : '0 18px 45px rgba(15, 23, 42, 0.08)',
                overflow: 'hidden',
              })}
            >
              {/* Saved Views */}
              <SavedViews activeView={savedView} onViewChange={setSavedView} counts={stats} />

              {/* Filter Command Bar */}
              <FilterCommandBar
                search={searchInput}
                category={categoryFilter}
                source={sourceFilter}
                stock={stockFilter}
                categories={categories}
                onSearchChange={setSearchInput}
                onCategoryChange={setCategoryFilter}
                onSourceChange={setSourceFilter}
                onStockChange={setStockFilter}
                onReset={handleResetFilters}
                totalCount={products.length}
                visibleCount={promoFilteredProducts.length}
              />

              {/* Products Table */}
              <Box sx={{ flex: 1, minHeight: 0 }}>
                {promoFilteredProducts.length === 0 && !loading ? (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <EmptyState
                      title="No products found"
                      message={searchInput || categoryFilter || sourceFilter || stockFilter
                        ? 'Try adjusting your filters'
                        : 'Create your first product to get started'}
                      icon={<InventoryIcon />}
                    />
                  </Box>
                ) : (
                  <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <ProductsTable
                      products={promoFilteredProducts}
                      categories={categories}
                      onRefresh={handleRefresh}
                      onRowClick={handleRowClick}
                      selectedProductId={selectedProduct?.id || null}
                      onAdjustStock={handleAdjustStock}
                      onResetStock={handleResetStock}
                      canResetStock={canResetStock}
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>

        {/* Right Pane - Product Details Panel */}
        {panelOpen && (
          <ProductDetailsPanel
            product={selectedProduct}
            open={panelOpen}
            onClose={handleClosePanel}
            onEdit={handleEdit}
            onSell={handleSell}
            onAddArrivage={handleAddArrivage}
            onViewHistory={handleViewHistory}
            onAdjustStock={handleAdjustStock}
            onResetStock={handleResetStock}
            canResetStock={canResetStock}
          />
        )}
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

      {/* Quick Sale Dialog */}
      <Dialog
        open={quickSaleOpen}
        onClose={handleQuickSaleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: (theme) => ({
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 30px 70px rgba(0, 0, 0, 0.55)'
              : '0 30px 70px rgba(15, 23, 42, 0.18)',
          }),
        }}
      >
        <DialogTitle
          sx={(theme) => ({
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(212, 20, 90, 0.22), rgba(99, 102, 241, 0.2))'
              : 'linear-gradient(135deg, rgba(212, 20, 90, 0.12), rgba(99, 102, 241, 0.12))',
            borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          })}
        >
          Quick Sale{quickSaleProduct ? ` - ${quickSaleProduct.name}` : ''}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mt: 2 }}>
            {quickSaleLoading ? (
              <LoadingState variant="card" rows={3} />
            ) : (
              <QuickSale
                products={quickSaleProducts}
                onSaleComplete={handleQuickSaleComplete}
                initialProductId={quickSaleProduct?.id}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {productToReset && (
        <ResetStockDialog
          open={resetStockDialogOpen}
          onClose={() => {
            setResetStockDialogOpen(false);
            setProductToReset(null);
          }}
          productId={productToReset.id}
          productName={productToReset.name}
          currentStock={productToReset.currentStock}
          currentSold={productToReset.quantitySold}
          onSuccess={handleStockAdjustmentSuccess}
        />
      )}

      {/* Product Form */}
      {createFormOpen && (
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
      )}

      {/* Import Products Dialog */}
      {importDialogOpen && (
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
      )}
      </Box>
    </Box>
  );
}
