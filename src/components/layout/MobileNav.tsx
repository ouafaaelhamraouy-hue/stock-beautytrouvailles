'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import { useUserProfile } from '@/hooks/useUserProfile';

export function MobileNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUserProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'ADMIN';

  const mainNavItems = [
    { label: t('dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { label: t('products'), icon: <InventoryIcon />, path: '/products' },
    { label: t('quickSale'), icon: <PointOfSaleIcon />, path: '/quick-sale' },
    { label: t('inventory'), icon: <WarehouseIcon />, path: '/inventory' },
  ];

  const menuItems = [
    { label: t('shipments'), icon: <LocalShippingIcon />, path: '/shipments', adminOnly: true },
    { label: t('expenses'), icon: <ReceiptIcon />, path: '/expenses', adminOnly: true },
    { label: t('reports'), icon: <AssessmentIcon />, path: '/reports' },
    { label: t('settings'), icon: <SettingsIcon />, path: '/settings', adminOnly: true },
    { label: t('users'), icon: <PeopleIcon />, path: '/users', adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter((item) => !item.adminOnly || isAdmin);

  const handleNavigation = (path: string) => {
    router.push(path);
    setMenuOpen(false);
  };

  const getCurrentValue = () => {
    // next-intl pathname doesn't include locale prefix
    const current = mainNavItems.findIndex(
      (item) => pathname === item.path || pathname?.startsWith(item.path + '/')
    );
    return current >= 0 ? current : 0;
  };

  return (
    <>
      <Paper
        sx={(theme) => ({
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: { xs: 'block', md: 'none' },
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.95)' 
            : theme.palette.background.paper,
          backdropFilter: 'blur(8px)',
          borderTop: `1px solid ${theme.palette.divider}`,
        })}
        elevation={8}
      >
        <BottomNavigation
          value={getCurrentValue()}
          onChange={(_, newValue) => {
            if (newValue < mainNavItems.length) {
              handleNavigation(mainNavItems[newValue].path);
            } else {
              setMenuOpen(true);
            }
          }}
          showLabels
          sx={(theme) => ({
            backgroundColor: 'transparent',
            height: 70,
            '& .MuiBottomNavigationAction-root': {
              color: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.5)'
                : 'rgba(0, 0, 0, 0.6)',
              minWidth: 64,
              padding: '8px 12px 10px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(212, 20, 90, 0.15)'
                  : 'rgba(212, 20, 90, 0.08)',
                borderRadius: '12px',
                margin: '4px',
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginTop: '4px',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.5rem',
                  filter: theme.palette.mode === 'dark'
                    ? 'drop-shadow(0 0 8px rgba(212, 20, 90, 0.4))'
                    : 'none',
                },
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: 500,
                marginTop: '4px',
                opacity: theme.palette.mode === 'dark' ? 0.8 : 1,
                '&.Mui-selected': {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                },
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1.4rem',
              },
            },
          })}
        >
          {mainNavItems.map((item, index) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
              value={index}
            />
          ))}
          <BottomNavigationAction
            label={t('menu')}
            icon={<MenuIcon />}
            value={mainNavItems.length}
          />
        </BottomNavigation>
      </Paper>

      {/* Menu Drawer */}
      <Drawer
        anchor="bottom"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        PaperProps={{
          sx: (theme) => ({
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '70vh',
            backgroundColor: theme.palette.background.paper,
            backgroundImage: 'none',
          }),
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              fontWeight: 700, 
              mb: 2,
              color: 'text.primary',
            }}
          >
            {t('menu')}
          </Typography>
          <List sx={{ px: 0 }}>
            {filteredMenuItems.map((item) => {
              // next-intl pathname doesn't include locale prefix
              const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={isActive}
                    onClick={() => handleNavigation(item.path)}
                    sx={(theme) => ({
                      borderRadius: 2,
                      py: 1.5,
                      px: 2,
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(212, 20, 90, 0.2)'
                          : 'rgba(212, 20, 90, 0.1)',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(212, 20, 90, 0.25)'
                            : 'rgba(212, 20, 90, 0.15)',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'primary.main',
                        },
                        '& .MuiListItemText-primary': {
                          color: 'primary.main',
                          fontWeight: 600,
                        },
                      },
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                    })}
                  >
                    <ListItemIcon 
                      sx={{ 
                        color: isActive ? 'primary.main' : 'text.secondary',
                        minWidth: 48,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
