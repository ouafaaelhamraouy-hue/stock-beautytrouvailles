import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { User as PrismaUser } from '@prisma/client';

type UserProfile = PrismaUser;

async function fetchUserProfile(): Promise<UserProfile> {
  const response = await fetch('/api/user/profile');
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
}

export function useUserProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading: loading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: fetchUserProfile,
    enabled: !!user, // Only fetch if user is logged in
    staleTime: 1000 * 60 * 10, // 10 minutes - profile rarely changes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
    retry: 2,
  });

  return { profile: profile || null, loading };
}
