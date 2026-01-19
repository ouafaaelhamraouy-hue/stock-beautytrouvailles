'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, TextField, MenuItem, Button, Divider } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductForm } from '@/components/products/ProductForm';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { SearchInput } from '@/components/ui';
import InventoryIcon from '@mui/icons-material/Inventory';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  category: {
    id: string;
    name: string;
  };
  basePriceEUR: number;
  basePriceDH: number;
  totalStock: number;
  totalSold: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const { profile } = useUserProfile();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [createFormOpen, setCreateFormOpen] = useState(false);

  const isAdmin = profile?.role === 'ADMIN';

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (categoryFilter) {
        params.append('categoryId', categoryFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to fetch categories';
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setCategories(data || []);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      // Set empty array on error so the form still works
      setCategories([]);
      // Only show error toast if not unauthorized (which might be a UI state issue)
      if (!err.message?.includes('Unauthorized') && !err.message?.includes('403')) {
        toast.error(err.message || 'Failed to load categories');
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [categoryFilter, searchQuery]);

  const handleRefresh = () => {
    fetchProducts();
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }

    const csvData = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.category.name,
      'Base Price (EUR)': p.basePriceEUR,
      'Base Price (DH)': p.basePriceDH,
      'Total Stock': p.totalStock,
      'Total Sold': p.totalSold,
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Products exported to CSV');
  };

  const handleExportExcel = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }

    try {
      const excelData = products.map((p) => ({
        SKU: p.sku,
        Name: p.name,
        Description: p.description || '',
        Category: p.category.name,
        'Base Price (EUR)': p.basePriceEUR,
        'Base Price (DH)': p.basePriceDH,
        'Total Stock': p.totalStock,
        'Total Sold': p.totalSold,
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
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('products')}
          </Typography>
          <LoadingState variant="table" rows={5} />
        </Box>
      </Container>
    );
  }

  if (error && products.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('products')}
          </Typography>
          <ErrorState message={error} onRetry={fetchProducts} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('products')}
          </Typography>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_CREATE') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateFormOpen(true)}
                sx={{
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                  },
                }}
              >
                {tCommon('create')} {t('products')}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportCSV}
              disabled={products.length === 0}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.light',
                  color: 'white',
                },
              }}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportExcel}
              disabled={products.length === 0}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.light',
                  color: 'white',
                },
              }}
            >
              Export Excel
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Paper 
          elevation={2}
          sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 2,
            background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }}
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
            elevation={2}
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <EmptyState
              title="No products found"
              message="Create your first product to get started"
              icon={<InventoryIcon />}
            />
          </Paper>
        ) : (
          <Paper 
            elevation={2}
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
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
      </Box>
    </Container>
  );
}
