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
  IconButton,
  Link as MuiLink,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from 'next-intl';

// Decorative graphics component for the right side
function WelcomeGraphics() {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
      }}
    >
      {/* Abstract shapes */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.3,
        }}
      >
        {/* Large pink triangle */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '15%',
            width: 120,
            height: 120,
            background: 'rgba(255, 255, 255, 0.2)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            transform: 'rotate(45deg)',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'rotate(45deg) translateY(0px)' },
              '50%': { transform: 'rotate(45deg) translateY(-20px)' },
            },
          }}
        />
        {/* Medium purple triangle */}
        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            left: '10%',
            width: 80,
            height: 80,
            background: 'rgba(255, 255, 255, 0.15)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            transform: 'rotate(-30deg)',
            animation: 'float 8s ease-in-out infinite',
            animationDelay: '1s',
          }}
        />
        {/* Small pink triangle */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            width: 60,
            height: 60,
            background: 'rgba(255, 255, 255, 0.25)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            transform: 'rotate(60deg)',
            animation: 'float 7s ease-in-out infinite',
            animationDelay: '2s',
          }}
        />
        {/* Medium pink triangle */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '30%',
            left: '20%',
            width: 100,
            height: 100,
            background: 'rgba(255, 255, 255, 0.18)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            transform: 'rotate(-60deg)',
            animation: 'float 9s ease-in-out infinite',
            animationDelay: '0.5s',
          }}
        />
        {/* Small purple triangle */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            right: '30%',
            width: 50,
            height: 50,
            background: 'rgba(255, 255, 255, 0.2)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            transform: 'rotate(120deg)',
            animation: 'float 5s ease-in-out infinite',
            animationDelay: '1.5s',
          }}
        />
        {/* Large purple triangle */}
        <Box
          sx={{
            position: 'absolute',
            top: '60%',
            left: '15%',
            width: 140,
            height: 140,
            background: 'rgba(255, 255, 255, 0.12)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            transform: 'rotate(-120deg)',
            animation: 'float 10s ease-in-out infinite',
            animationDelay: '2.5s',
          }}
        />
      </Box>

      {/* Welcome text */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          px: 4,
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            color: '#FFFFFF',
            fontSize: { xs: '2rem', md: '3rem', lg: '3.5rem' },
            mb: 2,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          }}
        >
          Welcome to BeautyTrouvailles
        </Typography>
      </Box>
    </Box>
  );
}

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
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
        backgroundColor: '#FAFBFC',
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
          py: { xs: 5, sm: 6 },
          backgroundColor: '#FFFFFF',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 400,
          }}
        >
          {/* Logo/Branding */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 5,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
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
                color: '#111827',
                fontSize: '1.35rem',
              }}
            >
              BeautyTrouvailles
            </Typography>
          </Box>

          {/* Welcome heading */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#111827',
              mb: 0.5,
              fontSize: '1.75rem',
            }}
          >
            {t('welcomeBack')}
          </Typography>
          
          <Typography
            variant="body2"
            sx={{
              color: '#6B7280',
              mb: 4,
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
                borderRadius: 1.5,
                fontSize: '0.875rem',
                py: 0.5,
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {/* Email field */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#374151',
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
                    borderRadius: 1.5,
                    backgroundColor: '#FAFBFC',
                    fontSize: '0.875rem',
                    height: '40px',
                    '& fieldset': {
                      borderColor: '#E5E7EB',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#EC4899',
                      borderWidth: '1.5px',
                    },
                  },
                  '& .MuiInputBase-input': {
                    py: 1.25,
                  },
                }}
              />
            </Box>

            {/* Password field */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.75,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: '#374151',
                    fontSize: '0.875rem',
                  }}
                >
                  {t('password')}
                </Typography>
                <MuiLink
                  href="#"
                  sx={{
                    fontSize: '0.8125rem',
                    color: '#EC4899',
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {t('forgotPassword')}
                </MuiLink>
              </Box>
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
                    borderRadius: 1.5,
                    backgroundColor: '#FAFBFC',
                    fontSize: '0.875rem',
                    height: '40px',
                    '& fieldset': {
                      borderColor: '#E5E7EB',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#EC4899',
                      borderWidth: '1.5px',
                    },
                  },
                  '& .MuiInputBase-input': {
                    py: 1.25,
                  },
                }}
              />
            </Box>

            {/* Remember me */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                  sx={{
                    color: '#EC4899',
                    '&.Mui-checked': {
                      color: '#EC4899',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>
                  {t('rememberMe')}
                </Typography>
              }
              sx={{ mb: 3 }}
            />

            {/* Sign in button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || authLoading}
              sx={{
                py: 1.25,
                mb: 2.5,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.875rem',
                textTransform: 'none',
                boxShadow: '0 2px 8px 0 rgba(236, 72, 153, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #DB2777 0%, #7C3AED 100%)',
                  boxShadow: '0 4px 12px 0 rgba(236, 72, 153, 0.35)',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&.Mui-disabled': {
                  background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                  opacity: 0.6,
                },
              }}
            >
              {isLoading || authLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                t('loginButton')
              )}
            </Button>

            {/* Divider */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                my: 2.5,
              }}
            >
              <Divider sx={{ flex: 1, borderColor: '#E5E7EB' }} />
              <Typography
                variant="body2"
                sx={{
                  px: 2,
                  color: '#9CA3AF',
                  fontSize: '0.8125rem',
                }}
              >
                {t('orContinueWith')}
              </Typography>
              <Divider sx={{ flex: 1, borderColor: '#E5E7EB' }} />
            </Box>

            {/* Google login button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || authLoading}
              startIcon={
                isGoogleLoading ? (
                  <CircularProgress size={18} />
                ) : (
                  <GoogleIcon sx={{ fontSize: 20 }} />
                )
              }
              sx={{
                py: 1.25,
                mb: 3,
                borderRadius: 1.5,
                borderColor: '#E5E7EB',
                color: '#374151',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                backgroundColor: '#FFFFFF',
                '&:hover': {
                  borderColor: '#D1D5DB',
                  backgroundColor: '#FAFBFC',
                },
                '&.Mui-disabled': {
                  borderColor: '#E5E7EB',
                  color: '#9CA3AF',
                },
              }}
            >
              Continue with Google
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
                  color: '#6B7280',
                  fontSize: '0.8125rem',
                }}
              >
                {t('dontHaveAccount')}{' '}
                <MuiLink
                  href="#"
                  sx={{
                    color: '#EC4899',
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

      {/* Right side - Welcome Graphics */}
      <Box
        sx={{
          flex: { xs: '0', lg: '1' },
          display: { xs: 'none', lg: 'flex' },
          position: 'relative',
          minHeight: { xs: 0, lg: '100vh' },
        }}
      >
        <WelcomeGraphics />
      </Box>
    </Box>
  );
}
