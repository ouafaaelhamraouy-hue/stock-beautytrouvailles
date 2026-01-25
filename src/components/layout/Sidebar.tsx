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
  Typography,
  IconButton,
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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useUserProfile } from '@/hooks/useUserProfile';

const DEFAULT_DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

interface SidebarProps {
  drawerWidth?: number;
  mobileOpen?: boolean;
  desktopOpen?: boolean;
  onMobileClose?: () => void;
  onDesktopToggle?: () => void;
  isMobile?: boolean;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

export function Sidebar({
  drawerWidth = DEFAULT_DRAWER_WIDTH,
  mobileOpen = false,
  desktopOpen = true,
  onMobileClose,
  onDesktopToggle,
  isMobile = false,
}: SidebarProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUserProfile();

  const isAdmin = profile?.role === 'ADMIN';
  const isCollapsed = !isMobile && !desktopOpen;

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

  const drawerContent = (
    <>
      <Toolbar
        sx={(theme) => ({
          background: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: '64px !important',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
        })}
      >
        {!isCollapsed && (
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
            BeautyTrouvailles
          </Typography>
        )}
        {!isMobile && onDesktopToggle && (
          <IconButton
            onClick={onDesktopToggle}
              sx={(theme) => ({
                color: 'text.primary',
                ml: 'auto',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              })}
          >
            {desktopOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
      </Toolbar>
      <Box 
        sx={(theme) => ({ 
          overflow: 'auto', 
          py: 2,
          pb: 3,
          height: 'calc(100vh - 64px)',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'rgba(0, 0, 0, 0.3)',
            },
          },
        })}
      >
        <List>
          {filteredNavItems.map((item) => {
            // next-intl pathname doesn't include locale prefix
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleNavigation(item.path)}
                  sx={(theme) => ({
                    borderRadius: 2,
                    mx: 1,
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(212, 20, 90, 0.2)'
                        : 'rgba(212, 20, 90, 0.1)',
                      color: 'primary.main',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(212, 20, 90, 0.3)'
                          : 'rgba(212, 20, 90, 0.15)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(0, 0, 0, 0.04)',
                    },
                  })}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      minWidth: isCollapsed ? 0 : 40,
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!isCollapsed && <ListItemText primary={item.label} />}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        {filteredAdminItems.length > 0 && (
          <>
            <Divider 
              sx={(theme) => ({ 
                my: 2,
                mx: 2,
                borderColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.12)' 
                  : 'rgba(0, 0, 0, 0.08)',
              })} 
            />
            {!isCollapsed && (
              <Typography
                variant="caption"
                sx={(theme) => ({
                  px: 3,
                  py: 1,
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'block',
                })}
              >
                Administration
              </Typography>
            )}
            <List>
              {filteredAdminItems.map((item) => {
                // next-intl pathname doesn't include locale prefix
                const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                return (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => {
                        handleNavigation(item.path);
                        if (isMobile && onMobileClose) {
                          onMobileClose();
                        }
                      }}
                      sx={(theme) => ({
                        borderRadius: 2,
                        mx: 1,
                        mb: 0.5,
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        px: isCollapsed ? 1 : 2,
                        transition: 'all 0.2s ease',
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(212, 20, 90, 0.2)'
                            : 'rgba(212, 20, 90, 0.1)',
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark'
                              ? 'rgba(212, 20, 90, 0.3)'
                              : 'rgba(212, 20, 90, 0.15)',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'primary.main',
                          },
                        },
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(0, 0, 0, 0.04)',
                        },
                      })}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? 'primary.main' : 'text.secondary',
                          minWidth: isCollapsed ? 0 : 40,
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!isCollapsed && <ListItemText primary={item.label} />}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </Box>
    </>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={(theme) => ({
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DEFAULT_DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
          },
        })}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={(theme) => ({
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        })}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
