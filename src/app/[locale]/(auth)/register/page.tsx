'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Link as MuiLink,
  useTheme,
  alpha,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Truck, Receipt, Package } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';

const INVITE_CODES = (process.env.NEXT_PUBLIC_INVITE_CODES || process.env.NEXT_PUBLIC_INVITE_CODE || '')
  .split(',')
  .map((code) => code.trim())
  .filter(Boolean);

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

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const theme = useTheme();
  const { signUp, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptApproval, setAcceptApproval] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMode, setSuccessMode] = useState<'none' | 'check-email' | 'pending'>('none');

  const requiresInvite = INVITE_CODES.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    if (!acceptApproval) {
      setError(t('approvalConsentRequired'));
      return;
    }

    if (requiresInvite) {
      const normalized = inviteCode.trim();
      if (!normalized || !INVITE_CODES.includes(normalized)) {
        setError(t('invalidInviteCode'));
        return;
      }
    }

    setIsLoading(true);

    const { error, data } = await signUp({
      email,
      password,
      fullName,
      inviteCode: inviteCode.trim() || undefined,
    });

    if (error) {
      setError(error.message || t('signupError'));
      setIsLoading(false);
      return;
    }

    if (data?.session) {
      setSuccessMode('pending');
      router.push(`/${locale}/pending`);
      router.refresh();
      return;
    }

    setSuccessMode('check-email');
    setIsLoading(false);
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
        <Box sx={{ width: '100%', maxWidth: 440 }}>
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

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 0.5,
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
            }}
          >
            {t('createAccount')}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 3.5,
              fontSize: '0.875rem',
            }}
          >
            {t('registerTitle')}
          </Typography>

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

          {successMode === 'check-email' && (
            <Alert
              severity="success"
              sx={{
                mb: 3,
                borderRadius: 2,
                fontSize: '0.875rem',
              }}
            >
              <strong>{t('checkEmailTitle')}</strong>
              <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                {t('checkEmailMessage', { email })}
              </Box>
            </Alert>
          )}

          {successMode !== 'check-email' && (
            <>
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  {t('pendingApprovalTitle')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('pendingApprovalMessage')}
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
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
                    {t('fullName')}
                  </Typography>
                  <TextField
                    fullWidth
                    id="fullName"
                    name="fullName"
                    placeholder={t('enterFullName')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading || authLoading}
                    required
                    autoComplete="name"
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
                    autoComplete="new-password"
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
                    {t('confirmPassword')}
                  </Typography>
                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder={t('enterConfirmPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading || authLoading}
                    required
                    autoComplete="new-password"
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
                    {t('inviteCode')}
                  </Typography>
                  <TextField
                    fullWidth
                    id="inviteCode"
                    name="inviteCode"
                    placeholder={t('enterInviteCode')}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    disabled={isLoading || authLoading}
                    required={requiresInvite}
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
                    helperText={
                      requiresInvite
                        ? t('inviteCodeRequired')
                        : t('inviteCodeOptional')
                    }
                    FormHelperTextProps={{ sx: { fontSize: '0.75rem' } }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={acceptApproval}
                        onChange={(e) => setAcceptApproval(e.target.checked)}
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
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                        {t('approvalConsent')}
                      </Typography>
                    }
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading || authLoading}
                  sx={{
                    height: 48,
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    textTransform: 'none',
                    boxShadow: theme.shadows[2],
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                      boxShadow: theme.shadows[4],
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  {isLoading || authLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    t('requestAccess')
                  )}
                </Button>
              </Box>
            </>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.8125rem',
              }}
            >
              {t('alreadyHaveAccount')}{' '}
              <MuiLink
                href={`/${locale}/login`}
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('signIn')}
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Box>

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
