'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useUserProfile } from '@/hooks/useUserProfile';
import { canAccessAdminPages } from '@/lib/permissions';
import { Box, Typography, CircularProgress } from '@mui/material';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  fallbackPath?: string;
}

export function RouteGuard({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  fallbackPath = '/dashboard',
}: RouteGuardProps) {
  const { profile, loading: isLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!profile) {
      router.push('/login');
      return;
    }

    if (requireSuperAdmin && profile.role !== 'SUPER_ADMIN') {
      router.push(fallbackPath);
      return;
    }

    if (requireAdmin && !canAccessAdminPages(profile.role)) {
      router.push(fallbackPath);
      return;
    }
  }, [profile, isLoading, requireAdmin, requireSuperAdmin, router, fallbackPath]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Checking permissions...
        </Typography>
      </Box>
    );
  }

  if (!profile) {
    return null; // Will redirect
  }

  if (requireSuperAdmin && profile.role !== 'SUPER_ADMIN') {
    return null; // Will redirect
  }

  if (requireAdmin && !canAccessAdminPages(profile.role)) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
