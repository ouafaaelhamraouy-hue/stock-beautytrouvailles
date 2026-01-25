import { useQuery } from '@tanstack/react-query';

interface Category {
  id: string;
  name: string;
  nameFr?: string;
  description?: string;
  targetMargin?: number;
  minMargin?: number;
  color?: string;
}

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  const data = await response.json();
  return data.categories || data;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 15, // 15 minutes - categories rarely change
    gcTime: 1000 * 60 * 60,    // 1 hour cache
    retry: 2,
  });
}
