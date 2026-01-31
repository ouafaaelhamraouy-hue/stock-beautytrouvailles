'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Divider,
  Link as MuiLink,
  useTheme,
  alpha,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { Truck, Receipt, Package } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from 'next-intl';

// Value proposition component for the right panel
function ValueProposition() {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
        py: 6,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary?.main || theme.palette.primary.main, 0.06)} 100%)`,
      }}
    >
      {/* Subtle background shapes */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.15,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '15%',
            width: 100,
            height: 100,
            background: alpha(theme.palette.primary.main, 0.1),
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            transform: 'rotate(45deg)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: '10%',
            width: 80,
            height: 80,
            background: alpha(theme.palette.primary.main, 0.08),
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            transform: 'rotate(-30deg)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            right: '20%',
            width: 60,
            height: 60,
            background: alpha(theme.palette.primary.main, 0.12),
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            transform: 'rotate(120deg)',
          }}
        />
      </Box>

      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: 400,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            fontSize: { xs: '1.5rem', md: '1.75rem' },
            mb: 1.5,
          }}
        >
          Stock Dashboard
        </Typography>
        
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: 4,
            fontSize: '0.875rem',
          }}
        >
          Manage your inventory, sales, and expenses in one place
        </Typography>

        {/* Value proposition bullets */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              <Truck size={20} weight="regular" />
            </Box>
            <Box sx={{ textAlign: 'left', flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
                Arrivages
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                Track shipments and inventory
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              <Receipt size={20} weight="regular" />
            </Box>
            <Box sx={{ textAlign: 'left', flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
                Sales
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                Monitor revenue and transactions
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              <Package size={20} weight="regular" />
            </Box>
            <Box sx={{ textAlign: 'left', flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
                Expenses
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                Track operational costs
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const theme = useTheme();
  const { signIn, signInWithGoogle, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message || t('invalidCredentials'));
      setIsLoading(false);
    } else {
      // Redirect to dashboard
      router.push(`/${locale}/dashboard`);
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    
    const { error } = await signInWithGoogle();
    
    if (error) {
      setError(error.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
    // If successful, user will be redirected by OAuth flow
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        backgroundColor: 'background.default',
      }}
    >
      {/* Left side - Login Form */}
      <Box
        sx={{
          flex: { xs: '1', lg: '0 0 50%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 4, md: 5 },
          py: { xs: 4, sm: 5, lg: 6 },
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
          }}
        >
          {/* Mobile: Value proposition header */}
          <Box
            sx={{
              display: { xs: 'block', lg: 'none' },
              mb: 4,
              pb: 3,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 1,
                fontSize: '1.5rem',
              }}
            >
              Stock Dashboard
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
              }}
            >
              Manage your inventory, sales, and expenses
            </Typography>
          </Box>

          {/* Logo/Branding */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: { xs: 3, sm: 4 },
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary?.main || theme.palette.primary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.contrastText',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              BT
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                fontSize: '1.25rem',
              }}
            >
              BeautyTrouvailles
            </Typography>
          </Box>

          {/* Welcome heading */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 0.5,
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
            }}
          >
            {t('welcomeBack')}
          </Typography>
          
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 3.5,
              fontSize: '0.875rem',
            }}
          >
            {t('loginTitle')}
          </Typography>

          {/* Error alert */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                fontSize: '0.875rem',
              }}
            >
              {error}
            </Alert>
          )}

          {/* Google login button - PRIMARY CTA */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || authLoading}
            startIcon={
              isGoogleLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <GoogleIcon sx={{ fontSize: 20 }} />
              )
            }
            sx={{
              height: 48,
              mb: 3,
              borderRadius: 2,
              backgroundColor: 'background.paper',
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '0.9375rem',
              textTransform: 'none',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[1],
              '&:hover': {
                backgroundColor: 'action.hover',
                boxShadow: theme.shadows[2],
                borderColor: 'divider',
              },
              '&:focus-visible': {
                outline: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                outlineOffset: 2,
              },
              '&.Mui-disabled': {
                backgroundColor: 'action.disabledBackground',
                color: 'action.disabled',
              },
            }}
          >
            Continue with Google
          </Button>

          {/* Divider */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              my: 3,
            }}
          >
            <Divider sx={{ flex: 1, borderColor: 'divider' }} />
            <Typography
              variant="body2"
              sx={{
                px: 2,
                color: 'text.secondary',
                fontSize: '0.8125rem',
              }}
            >
              {t('orContinueWith')}
            </Typography>
            <Divider sx={{ flex: 1, borderColor: 'divider' }} />
          </Box>

          {/* Email/Password form - SECONDARY */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {/* Email field */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: 'text.primary',
                  mb: 0.75,
                  fontSize: '0.875rem',
                }}
              >
                {t('emailAddress')}
              </Typography>
              <TextField
                fullWidth
                id="email"
                name="email"
                type="email"
                placeholder={t('enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || authLoading}
                required
                autoComplete="email"
                autoFocus
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'background.default',
                    fontSize: '0.875rem',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'action.active',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              />
            </Box>

            {/* Password field */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: 'text.primary',
                  mb: 0.75,
                  fontSize: '0.875rem',
                }}
              >
                {t('password')}
              </Typography>
              <TextField
                fullWidth
                id="password"
                name="password"
                type="password"
                placeholder={t('enterPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || authLoading}
                required
                autoComplete="current-password"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'background.default',
                    fontSize: '0.875rem',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'action.active',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              />
            </Box>

            {/* Remember me and Forgot password - same row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    sx={{
                      color: 'primary.main',
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    {t('rememberMe')}
                  </Typography>
                }
              />
              <MuiLink
                href="#"
                sx={{
                  fontSize: '0.8125rem',
                  color: 'text.secondary',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('forgotPassword')}
              </MuiLink>
            </Box>

            {/* Sign in button - SECONDARY STYLE */}
            <Button
              type="submit"
              fullWidth
              variant="outlined"
              disabled={isLoading || authLoading}
              sx={{
                height: 48,
                mb: 3,
                borderRadius: 2,
                borderColor: 'divider',
                color: 'text.primary',
                fontWeight: 600,
                fontSize: '0.9375rem',
                textTransform: 'none',
                backgroundColor: 'background.paper',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                },
                '&:focus-visible': {
                  outline: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                  outlineOffset: 2,
                },
                '&.Mui-disabled': {
                  borderColor: 'action.disabledBackground',
                  color: 'action.disabled',
                },
              }}
            >
              {isLoading || authLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                t('loginButton')
              )}
            </Button>

            {/* Sign up link */}
            <Box
              sx={{
                textAlign: 'center',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                }}
              >
                {t('dontHaveAccount')}{' '}
                <MuiLink
                  href={`/${locale}/register`}
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {t('signUp')}
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right side - Value Proposition (Desktop only) */}
      <Box
        sx={{
          flex: { xs: '0', lg: '1' },
          display: { xs: 'none', lg: 'flex' },
          position: 'relative',
          minHeight: { xs: 0, lg: '100vh' },
          backgroundColor: 'background.default',
        }}
      >
        <ValueProposition />
      </Box>
    </Box>
  );
}
