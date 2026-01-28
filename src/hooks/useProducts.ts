'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Product {
  id: string;
  name: string; // Product name is the identifier (NO SKU)
  brand: string | null;
  category: string;
  categoryId: string;
  purchaseSource: 'ACTION' | 'CARREFOUR' | 'PHARMACIE' | 'AMAZON_FR' | 'SEPHORA' | 'RITUALS' | 'NOCIBE' | 'LIDL' | 'OTHER';
  purchasePriceEur: number | null; // PA (Prix Achat) in EUR (original)
  purchasePriceMad: number; // PA (Prix Achat) in MAD (calculated or direct)
  sellingPriceDh: number; // PV (Prix Vente) regular price
  promoPriceDh: number | null; // Prix promo (optional)
  quantityReceived: number; // Quantité
  quantitySold: number; // Qt vendu
  currentStock: number; // Auto-calculated: quantityReceived - quantitySold
  reorderLevel: number;
  margin: number; // Auto-calculated gross margin % (without packaging)
  netMargin: number; // Auto-calculated net margin % (includes packaging costs)
  exchangeRate: number; // Exchange rate from arrivage
  arrivageId: string | null;
  arrivageReference: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  source?: string;
  stock?: 'low' | 'out' | 'ok';
}

async function fetchProducts(params: ProductsParams = {}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params.search) searchParams.set('search', params.search);
  if (params.source) searchParams.set('source', params.source);
  if (params.stock) searchParams.set('stock', params.stock);

  const response = await fetch(`/api/products?${searchParams.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch products');
  }
  return response.json();
}

export function useProducts(params: ProductsParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    staleTime: 1000 * 60 * 2, // 2 minutes - products don't change that often
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    keepPreviousData: true, // Prevent UI flicker when filters change
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: string }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }
      return response.json();
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['products'] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['products', newData.id]);

      // Optimistically update
      queryClient.setQueryData(['products', newData.id], (old: Product | undefined) => ({
        ...old,
        ...newData,
      }));

      // Also update in list
      queryClient.setQueriesData({ queryKey: ['products'] }, (old: ProductsResponse | undefined) => {
        if (!old?.products) return old;
        return {
          ...old,
          products: old.products.map((p: Product) =>
            p.id === newData.id ? { ...p, ...newData } : p
          ),
        };
      });

      return { previous };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['products', newData.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useBulkUpdateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<Partial<Product> & { id: string }>) => {
      const response = await fetch('/api/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to bulk update products');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'currentStock' | 'margin' | 'netMargin'>) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
