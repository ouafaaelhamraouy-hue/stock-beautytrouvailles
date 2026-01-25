'use client';

import { useState } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Button, Grid, Stack } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ProductGrid } from '@/components/dashboard/ProductGrid';
import { KPICards } from '@/components/dashboard/KPICards';
import { BestSellers } from '@/components/dashboard/BestSellers';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { ProductForm } from '@/components/products/ProductForm';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission } from '@/lib/permissions';
import { useQuery } from '@tanstack/react-query';

export default function DashboardPage() {
  const t = useTranslations('common');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'low' | 'out' | 'ok' | ''>('');
  const [search, setSearch] = useState('');
  const [createFormOpen, setCreateFormOpen] = useState(false);

  const { profile } = useUserProfile();
  const isAdmin = profile?.role === 'ADMIN';

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.categories || [];
    },
  });

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

  const categories = categoriesData || [];
  const brands = brandsData || [];

  const handleExportExcel = () => {
    // Export logic will be implemented
    console.log('Export to Excel');
  };

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
      {/* Header Section - More Spacious */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
        <Box>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              color: 'text.primary', 
              letterSpacing: '-0.03em',
              mb: 1,
            }}
          >
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: '-0.01em' }}>
            Vue d'ensemble de votre stock et performances
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          {isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_CREATE') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateFormOpen(true)}
              sx={{ px: 3 }}
            >
              Nouveau produit
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            sx={(theme) => ({ 
              px: 3,
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : undefined,
              color: theme.palette.mode === 'dark' ? '#FFFFFF' : undefined,
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : undefined,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : undefined,
              },
            })}
          >
            Exporter Excel
          </Button>
        </Stack>
      </Stack>

      {/* KPI Cards - Horizontal Layout */}
      <Box sx={{ mb: 6 }}>
        <KPICards />
      </Box>

      {/* Main Content Grid - Two Column Layout */}
      <Grid container spacing={4}>
        {/* Left Column - Product Grid */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            {/* Filters Section */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600, 
                  letterSpacing: '-0.01em',
                  color: 'text.primary',
                }}
              >
                Filtrer les produits
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Rechercher"
                    value={search || ''}
                    onChange={(e) => setSearch(e.target.value)}
                    size="medium"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    select
                    label="Catégorie"
                    value={categoryFilter || ''}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    size="medium"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      },
                    }}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {categories.map((cat: any) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.nameFr || cat.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    select
                    label="Source"
                    value={sourceFilter || ''}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    size="medium"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      },
                    }}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    <MenuItem value="ACTION">Action</MenuItem>
                    <MenuItem value="CARREFOUR">Carrefour</MenuItem>
                    <MenuItem value="PHARMACIE">Pharmacie</MenuItem>
                    <MenuItem value="AMAZON_FR">Amazon FR</MenuItem>
                    <MenuItem value="SEPHORA">Sephora</MenuItem>
                    <MenuItem value="OTHER">Autre</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    select
                    label="Stock"
                    value={stockFilter || ''}
                    onChange={(e) => setStockFilter(e.target.value as any)}
                    size="medium"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      },
                    }}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="low">Stock bas</MenuItem>
                    <MenuItem value="out">Rupture</MenuItem>
                    <MenuItem value="ok">En stock</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Paper>

            {/* Product Grid Section */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600, 
                  letterSpacing: '-0.01em',
                  color: 'text.primary',
                }}
              >
                Produits
              </Typography>
              <ProductGrid
                categoryId={categoryFilter || undefined}
                search={search || undefined}
                source={sourceFilter || undefined}
                stockFilter={stockFilter || undefined}
              />
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column - Widgets */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={4}>
            <BestSellers />
            <LowStockAlerts />
          </Stack>
        </Grid>
      </Grid>

      {/* Product Form */}
      <ProductForm
        open={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSubmit={async (data) => {
          // Handle create
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
          // Refresh the page or update the product grid
          window.location.reload();
        }}
        categories={categories}
        brands={brands}
      />
    </Box>
  );
}
