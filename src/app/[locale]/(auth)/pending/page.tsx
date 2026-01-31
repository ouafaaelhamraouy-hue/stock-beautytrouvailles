'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function PendingApprovalPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  useEffect(() => {
    if (profile && profile.isActive) {
      router.push('/dashboard');
    }
  }, [profile, router]);

  if (authLoading || profileLoading) {
    return (
      <Box
        sx={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          flexDirection: 'column',
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {t('pleaseWait')}
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 480, width: '100%', textAlign: 'center' }} elevation={1}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {t('pendingApprovalTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('pendingApprovalLoginMessage')}
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/login')}
          >
            {t('signIn')}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 520, width: '100%', textAlign: 'center' }} elevation={1}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          {t('pendingApprovalTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('pendingApprovalMessage')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
          {t('pendingApprovalContact')}
        </Typography>
        <Button variant="outlined" onClick={() => router.push('/login')}>
          {t('backToLogin')}
        </Button>
      </Paper>
    </Box>
  );
}
