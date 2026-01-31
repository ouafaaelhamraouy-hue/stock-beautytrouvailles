'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  InputBase,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Box as MuiBox,
  ButtonBase,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import { useThemeMode } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter as useIntlRouter, usePathname as useIntlPathname } from '@/i18n/routing';
import { useUserProfile } from '@/hooks/useUserProfile';
import { alpha, styled } from '@mui/material/styles';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.common.white, 0.05)
    : alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.08)
      : alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const t = useTranslations('layout');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();
  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();
  const { mode, toggleMode } = useThemeMode();
  const [searchValue, setSearchValue] = useState('');
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [localeMenuAnchor, setLocaleMenuAnchor] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLocaleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLocaleMenuAnchor(event.currentTarget);
  };

  const handleLocaleMenuClose = () => {
    setLocaleMenuAnchor(null);
  };

  const handleLogout = async () => {
    await signOut();
    router.push(`/${locale}/login`);
    handleUserMenuClose();
  };

  const handleLocaleChange = (newLocale: string) => {
    // next-intl usePathname returns pathname without locale prefix
    // Use next-intl router to maintain locale-aware routing
    intlRouter.replace(intlPathname || '/dashboard', { locale: newLocale });
    handleLocaleMenuClose();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality in Phase 5+
    console.log('Search:', searchValue);
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={(theme) => ({ 
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.mode === 'dark' 
          ? theme.palette.background.paper 
          : '#FFFFFF',
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.08)',
        color: 'text.primary',
      })}
    >
      <Toolbar sx={{ minHeight: { xs: '56px !important', sm: '64px !important' }, px: { xs: 2, sm: 3 } }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={(theme) => ({ 
            mr: 2,
            color: 'text.primary',
            display: { xs: 'inline-flex', md: 'inline-flex' },
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)',
            },
          })}
          aria-label="Toggle sidebar"
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ 
            display: { xs: 'none', sm: 'block' },
            fontWeight: 700,
            fontSize: '1.125rem',
            color: 'text.primary',
            letterSpacing: '-0.02em',
          }}
        >
          BeautyTrouvailles
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* Search */}
        <form onSubmit={handleSearch}>
          <Search
            sx={(theme) => ({
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.04)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(0, 0, 0, 0.12)',
              },
              '&:focus-within': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
                borderColor: 'primary.main',
                boxShadow: '0 0 0 3px rgba(212, 20, 90, 0.1)',
              },
            })}
          >
            <SearchIconWrapper>
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder={t('searchPlaceholder')}
              inputProps={{ 'aria-label': 'search' }}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              sx={{
                color: 'text.primary',
                '& input::placeholder': {
                  color: 'text.secondary',
                  opacity: 1,
                },
              }}
            />
          </Search>
        </form>

        {/* Notifications */}
        <Tooltip title={t('notifications')}>
          <IconButton 
            onClick={handleNotificationsOpen}
            sx={(theme) => ({
              color: 'text.primary',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            })}
          >
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={notificationsAnchor}
          open={Boolean(notificationsAnchor)}
          onClose={handleNotificationsClose}
          PaperProps={{
            sx: (theme) => ({
              mt: 1,
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }),
          }}
        >
          <MenuItem disabled>{t('noNotifications')}</MenuItem>
        </Menu>

        {/* Theme Toggle */}
        <Tooltip title={`Theme: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}>
          <ButtonBase
            onClick={toggleMode}
            aria-label="Toggle theme"
            sx={(theme) => ({
              borderRadius: 999,
              p: 0.5,
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(0, 0, 0, 0.04)',
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 150ms ease',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            })}
          >
            <MuiBox
              sx={{
                position: 'relative',
                width: 84,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1,
                gap: 1,
              }}
            >
              <LightModeIcon sx={{ fontSize: 16, opacity: 0.6 }} />
              <AutoModeIcon sx={{ fontSize: 16, opacity: 0.6 }} />
              <DarkModeIcon sx={{ fontSize: 16, opacity: 0.6 }} />

              <MuiBox
                sx={(theme) => ({
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.background.paper,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 10px rgba(0, 0, 0, 0.4)'
                    : '0 4px 10px rgba(0, 0, 0, 0.12)',
                  transform: mode === 'light'
                    ? 'translateX(0)'
                    : mode === 'system'
                    ? 'translateX(26px)'
                    : 'translateX(52px)',
                  transition: 'transform 180ms ease',
                })}
              >
                {mode === 'light' && <LightModeIcon sx={{ fontSize: 16 }} />}
                {mode === 'dark' && <DarkModeIcon sx={{ fontSize: 16 }} />}
                {mode === 'system' && <AutoModeIcon sx={{ fontSize: 16 }} />}
              </MuiBox>
            </MuiBox>
          </ButtonBase>
        </Tooltip>

        {/* Locale Switch */}
        <Tooltip title={t('switchTo') + ' ' + (locale === 'en' ? 'Français' : 'English')}>
          <IconButton 
            onClick={handleLocaleMenuOpen}
            sx={(theme) => ({
              color: 'text.primary',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            })}
          >
            <LanguageIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={localeMenuAnchor}
          open={Boolean(localeMenuAnchor)}
          onClose={handleLocaleMenuClose}
          PaperProps={{
            sx: (theme) => ({
              mt: 1,
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }),
          }}
        >
          <MenuItem
            onClick={() => handleLocaleChange('en')}
            selected={locale === 'en'}
          >
            English
          </MenuItem>
          <MenuItem
            onClick={() => handleLocaleChange('fr')}
            selected={locale === 'fr'}
          >
            Français
          </MenuItem>
        </Menu>

        {/* User Menu */}
        {user && (
          <>
            <Tooltip title={t('userMenu')}>
              <IconButton 
                onClick={handleUserMenuOpen} 
                sx={(theme) => ({ 
                  ml: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(255, 255, 255, 0.15)',
                  },
                })}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              PaperProps={{
                sx: (theme) => ({
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  border: `1px solid ${theme.palette.divider}`,
                  minWidth: 200,
                  backgroundColor: theme.palette.background.paper,
                }),
              }}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {user.email}
                  </Typography>
                  {profile && (
                    <Typography variant="caption" color="text.secondary">
                      {profile.role === 'SUPER_ADMIN'
                        ? 'Super Admin'
                        : profile.role === 'ADMIN'
                          ? 'Admin'
                          : 'Staff'}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
              <MenuItem onClick={handleUserMenuClose}>
                <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                {t('profile')}
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                {tCommon('logout')}
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
