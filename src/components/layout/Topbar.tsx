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
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter as useIntlRouter, usePathname as useIntlPathname } from '@/i18n/routing';
import { useUserProfile } from '@/hooks/useUserProfile';
import { alpha, styled } from '@mui/material/styles';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
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

export function Topbar() {
  const t = useTranslations('layout');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();
  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();
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
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
          BeautyTrouvailles
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* Search */}
        <form onSubmit={handleSearch}>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder={t('searchPlaceholder')}
              inputProps={{ 'aria-label': 'search' }}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </Search>
        </form>

        {/* Notifications */}
        <Tooltip title={t('notifications')}>
          <IconButton color="inherit" onClick={handleNotificationsOpen}>
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={notificationsAnchor}
          open={Boolean(notificationsAnchor)}
          onClose={handleNotificationsClose}
        >
          <MenuItem disabled>{t('noNotifications')}</MenuItem>
        </Menu>

        {/* Locale Switch */}
        <Tooltip title={t('switchTo') + ' ' + (locale === 'en' ? 'Français' : 'English')}>
          <IconButton color="inherit" onClick={handleLocaleMenuOpen}>
            <LanguageIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={localeMenuAnchor}
          open={Boolean(localeMenuAnchor)}
          onClose={handleLocaleMenuClose}
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
              <IconButton onClick={handleUserMenuOpen} sx={{ ml: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
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
