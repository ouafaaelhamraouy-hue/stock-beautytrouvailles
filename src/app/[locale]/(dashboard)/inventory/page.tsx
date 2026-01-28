'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import { ShipmentAccordion } from '@/components/inventory/ShipmentAccordion';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';

interface Category {
  id: string;
  name: string;
  nameFr?: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Arrivage {
  id: string;
  reference: string;
  shipDate: string | null;
  purchaseDate: string | null;
  source: string;
  summary: {
    totalProducts: number;
    totalStock: number;
    totalSold: number;
    totalValue: number;
  };
  products: Array<{
    id: string;
    name: string;
    category: string;
    brand: string | null;
    purchasePriceMad: number;
    sellingPriceDh: number;
    promoPriceDh: number | null;
    stock: number;
    sold: number;
    margin: number;
    reorderLevel: number;
  }>;
}

export default function InventoryPage() {
  const [selectedArrivageId, setSelectedArrivageId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Fetch inventory data
  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError } = useQuery({
    queryKey: ['inventory', selectedArrivageId, selectedCategoryId, selectedBrandId, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedArrivageId) params.append('arrivageId', selectedArrivageId);
      if (selectedCategoryId) params.append('categoryId', selectedCategoryId);
      if (selectedBrandId) params.append('brandId', selectedBrandId);
      if (search) params.append('search', search);

      const response = await fetch(`/api/inventory/by-shipment?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    },
  });

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

  // Extract arrivages list for filter
  const arrivages: Arrivage[] = inventoryData?.arrivages || [];
  const categories: Category[] = categoriesData || [];
  const brands: Brand[] = brandsData || [];

  // Build unique arrivages list for filter dropdown
  const uniqueArrivages = arrivages.map((a) => ({
    id: a.id,
    reference: a.reference,
  }));

  if (inventoryLoading) {
    return <LoadingState variant="table" rows={5} />;
  }

  if (inventoryError) {
    return <ErrorState message="Erreur lors du chargement de l'inventaire" />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <WarehouseIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Inventaire
        </Typography>
      </Box>

      <InventoryFilters
        arrivages={uniqueArrivages}
        categories={categories}
        brands={brands}
        selectedArrivageId={selectedArrivageId}
        selectedCategoryId={selectedCategoryId}
        selectedBrandId={selectedBrandId}
        search={search}
        onArrivageChange={setSelectedArrivageId}
        onCategoryChange={setSelectedCategoryId}
        onBrandChange={setSelectedBrandId}
        onSearchChange={setSearch}
      />

      {arrivages.length === 0 ? (
        <EmptyState
          icon={<WarehouseIcon />}
          title="Aucun arrivage trouvé"
          message="Aucun produit n'a été trouvé avec les filtres sélectionnés."
        />
      ) : (
        <Box>
          {arrivages.map((arrivage, index) => (
            <ShipmentAccordion
              key={arrivage.id}
              reference={arrivage.reference}
              shipDate={arrivage.shipDate}
              source={arrivage.source}
              totalProducts={arrivage.summary.totalProducts}
              totalValue={arrivage.summary.totalValue}
              products={arrivage.products}
              defaultExpanded={index === 0}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
