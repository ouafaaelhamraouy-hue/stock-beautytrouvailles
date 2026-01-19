'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import BusinessIcon from '@mui/icons-material/Business';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useUserProfile } from '@/hooks/useUserProfile';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

export function Sidebar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUserProfile();

  const isAdmin = profile?.role === 'ADMIN';

  const navItems: NavItem[] = [
    { label: t('dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { label: t('products'), icon: <InventoryIcon />, path: '/products' },
    { label: t('shipments'), icon: <LocalShippingIcon />, path: '/shipments', adminOnly: true },
    { label: t('sales'), icon: <PointOfSaleIcon />, path: '/sales' },
    { label: t('inventory'), icon: <WarehouseIcon />, path: '/inventory' },
    { label: t('expenses'), icon: <ReceiptIcon />, path: '/expenses', adminOnly: true },
    { label: t('reports'), icon: <AssessmentIcon />, path: '/reports' },
  ];

  const adminItems: NavItem[] = [
    { label: t('categories'), icon: <FolderIcon />, path: '/categories', adminOnly: true },
    { label: t('suppliers'), icon: <BusinessIcon />, path: '/suppliers', adminOnly: true },
    { label: t('settings'), icon: <SettingsIcon />, path: '/settings', adminOnly: true },
    { label: t('users'), icon: <PeopleIcon />, path: '/users', adminOnly: true },
    { label: t('makeAdmin'), icon: <AdminPanelSettingsIcon />, path: '/admin/make-admin', adminOnly: true },
  ];

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const filteredAdminItems = adminItems.filter((item) => !item.adminOnly || isAdmin);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {filteredNavItems.map((item) => {
            // next-intl pathname doesn't include locale prefix
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'primary.contrastText' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        {filteredAdminItems.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <List>
              {filteredAdminItems.map((item) => {
                // next-intl pathname doesn't include locale prefix
                const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                return (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'primary.contrastText',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? 'primary.contrastText' : 'inherit',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
}
