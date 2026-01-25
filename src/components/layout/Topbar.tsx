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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
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
  const tNav = useTranslations('nav');
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
        // White text/icons on pink background in light mode
        color: theme.palette.mode === 'light' ? '#FFFFFF' : 'text.primary',
      })}
    >
      <Toolbar sx={{ minHeight: { xs: '56px !important', sm: '64px !important' }, px: { xs: 2, sm: 3 } }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={(theme) => ({ 
            mr: 2,
            color: theme.palette.mode === 'light' ? '#FFFFFF' : 'text.primary',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.15)',
            },
          })}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={(theme) => ({ 
            display: { xs: 'none', sm: 'block' },
            fontWeight: 700,
            fontSize: '1.125rem',
            color: theme.palette.mode === 'light' ? '#FFFFFF' : 'text.primary',
            letterSpacing: '-0.02em',
          })}
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
                : 'rgba(255, 255, 255, 0.15)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 255, 255, 0.25)',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.25)',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(255, 255, 255, 0.35)',
              },
              '&:focus-within': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.3)',
                borderColor: '#FFFFFF',
                boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.2)',
              },
            })}
          >
            <SearchIconWrapper>
              <SearchIcon sx={(theme) => ({ 
                color: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' 
              })} />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder={t('searchPlaceholder')}
              inputProps={{ 'aria-label': 'search' }}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              sx={(theme) => ({
                color: theme.palette.mode === 'light' ? '#FFFFFF' : 'text.primary',
                '& input::placeholder': {
                  color: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                  opacity: 1,
                },
              })}
            />
          </Search>
        </form>

        {/* Notifications */}
        <Tooltip title={t('notifications')}>
          <IconButton 
            onClick={handleNotificationsOpen}
            sx={(theme) => ({
              color: theme.palette.mode === 'light' ? '#FFFFFF' : 'text.primary',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.15)',
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
        <Tooltip title={mode === 'light' ? 'Mode sombre' : 'Mode clair'}>
          <IconButton 
            onClick={toggleMode}
            sx={(theme) => ({
              color: theme.palette.mode === 'light' ? '#FFFFFF' : 'text.primary',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.15)',
              },
            })}
          >
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>

        {/* Locale Switch */}
        <Tooltip title={t('switchTo') + ' ' + (locale === 'en' ? 'Français' : 'English')}>
          <IconButton 
            onClick={handleLocaleMenuOpen}
            sx={(theme) => ({
              color: theme.palette.mode === 'light' ? '#FFFFFF' : 'text.primary',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.15)',
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
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem', fontWeight: 600 }}>
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
                      {profile.role === 'ADMIN' ? 'Admin' : 'Staff'}
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
