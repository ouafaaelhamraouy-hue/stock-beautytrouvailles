'use client';

import { useTranslations, useLocale } from 'next-intl';
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
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import { useUserProfile } from '@/hooks/useUserProfile';

export function MobileNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
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
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: { xs: 'block', md: 'none' },
        }}
        elevation={3}
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
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '70vh',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('menu')}
          </Typography>
          <List>
            {filteredMenuItems.map((item) => {
              // next-intl pathname doesn't include locale prefix
              const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    selected={isActive}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
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
