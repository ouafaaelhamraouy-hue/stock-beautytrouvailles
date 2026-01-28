'use client';

import { useTranslations } from 'next-intl';
import { usePathname, Link } from '@/i18n/routing';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Avatar,
  Badge,
  alpha,
} from '@mui/material';
import {
  Gauge,
  Package,
  ShoppingCartSimple,
  Truck,
  Receipt,
  Tag,
  Storefront,
  GearSix,
  CaretLeft,
  CaretRight,
  type Icon,
} from '@phosphor-icons/react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { NavIcon } from './NavIcon';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 72;
const ITEM_HEIGHT = 46;
const ACTIVE_INDICATOR_WIDTH = 3;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  isMobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  label: string;
  icon: Icon;
  path: string;
  adminOnly?: boolean;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const STORAGE_KEY = 'sidebar-collapsed';

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
  isMobile = false,
  collapsed: collapsedProp,
  onToggleCollapse,
}: SidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { profile } = useUserProfile();
  const { user } = useAuth();
  
  // Use prop if provided (controlled), otherwise fall back to local state (uncontrolled)
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  });

  // If prop is provided, use it (controlled mode). Otherwise use internal state (uncontrolled mode)
  const collapsed = collapsedProp !== undefined ? collapsedProp : internalCollapsed;

  const isAdmin = profile?.role === 'ADMIN';
  const isCollapsed = !isMobile && collapsed;
  const drawerWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const handleToggleCollapse = () => {
    // Only toggle collapse on desktop
    if (isMobile) return;
    
    if (onToggleCollapse) {
      // Controlled mode: let parent handle the state
      onToggleCollapse();
    } else {
      // Uncontrolled mode: handle state internally
      const newCollapsed = !internalCollapsed;
      setInternalCollapsed(newCollapsed);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(newCollapsed));
      }
    }
  };

  // Main navigation items
  const mainItems: NavItem[] = [
    { label: t('dashboard'), icon: Gauge, path: '/dashboard' },
    { label: t('products'), icon: Package, path: '/products' },
    { label: t('sales'), icon: ShoppingCartSimple, path: '/sales' },
    { label: t('arrivages'), icon: Truck, path: '/shipments', adminOnly: true },
    { label: t('expenses'), icon: Receipt, path: '/expenses', adminOnly: true },
  ];

  // Insights section - Hidden for MVP (can be enabled later)
  const insightsItems: NavItem[] = [
    // { label: t('inventory'), icon: Stack, path: '/inventory' },
    // { label: t('reports'), icon: ChartBar, path: '/reports' },
  ];

  // Admin section
  const adminItems: NavItem[] = [
    { label: t('categories'), icon: Tag, path: '/categories', adminOnly: true },
    { label: t('brands'), icon: Storefront, path: '/brands', adminOnly: true },
    { label: t('settings'), icon: GearSix, path: '/settings', adminOnly: true },
  ];

  const sections: NavSection[] = [
    { title: 'Main', items: mainItems },
    { title: 'Insights', items: insightsItems },
    { title: 'Admin', items: adminItems },
  ];

  // Filter items based on admin status
  const filteredSections = sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.adminOnly || isAdmin),
  })).filter((section) => section.items.length > 0);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const NavItemButton = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);
    
    return (
      <ListItem disablePadding sx={{ mb: 0.5, px: 1 }}>
        <Tooltip
          title={isCollapsed ? item.label : ''}
          placement="right"
          arrow
          enterDelay={isCollapsed ? 300 : 0}
        >
          <ListItemButton
            component={Link}
            href={item.path}
            selected={active}
            onClick={() => {
              if (isMobile && onMobileClose) {
                onMobileClose();
              }
            }}
            sx={(theme) => ({
              height: ITEM_HEIGHT,
              borderRadius: '12px',
              position: 'relative',
              px: isCollapsed ? 1.5 : 2,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              transition: theme.transitions.create(
                ['background-color', 'width', 'margin'],
                {
                  duration: theme.transitions.duration.shorter,
                  easing: theme.transitions.easing.easeInOut,
                }
              ),
              // Active indicator (left bar)
              '&::before': active
                ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: ACTIVE_INDICATOR_WIDTH,
                    height: '60%',
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: '0 2px 2px 0',
                    transition: theme.transitions.create(['height', 'opacity'], {
                      duration: theme.transitions.duration.shorter,
                    }),
                  }
                : {},
              // Selected background
              '&.Mui-selected': {
                backgroundColor: theme.palette.action.selected,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.action.selected, 0.8)
                    : alpha(theme.palette.primary.main, 0.08),
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
                '& .MuiListItemText-primary': {
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                },
              },
              // Hover state - icon color changes to text.primary (unless active)
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                '&:not(.Mui-selected) .MuiListItemIcon-root': {
                  color: theme.palette.text.primary,
                },
              },
            })}
          >
            <ListItemIcon
              sx={(theme) => ({
                minWidth: isCollapsed ? 0 : 40,
                justifyContent: 'center',
                color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                transition: theme.transitions.create('color', {
                  duration: theme.transitions.duration.shorter,
                }),
              })}
            >
              {item.badge && isCollapsed ? (
                <Badge
                  badgeContent=""
                  color="error"
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      right: 2,
                      top: 2,
                    },
                  }}
                >
                  <NavIcon
                    icon={item.icon}
                    active={active}
                    collapsed={isCollapsed}
                  />
                </Badge>
              ) : (
                <NavIcon
                  icon={item.icon}
                  active={active}
                  collapsed={isCollapsed}
                />
              )}
            </ListItemIcon>
            {!isCollapsed && (
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 500,
                }}
                sx={(theme) => ({
                  transition: theme.transitions.create('font-weight', {
                    duration: theme.transitions.duration.shorter,
                  }),
                })}
              />
            )}
            {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
              <Chip
                label={item.badge}
                size="small"
                color="error"
                sx={{
                  height: 20,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  minWidth: 20,
                  '& .MuiChip-label': {
                    px: 0.75,
                  },
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box
        sx={(theme) => ({
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          flexShrink: 0,
        })}
      >
        {!isCollapsed && (
          <Typography
            variant="h6"
            sx={(theme) => ({
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
              color: 'text.primary',
              transition: theme.transitions.create('opacity', {
                duration: theme.transitions.duration.shorter,
              }),
            })}
          >
            BeautyTrouvailles
          </Typography>
        )}
        {!isMobile && (
          <Tooltip title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
            <IconButton
              onClick={handleToggleCollapse}
              size="small"
              sx={(theme) => ({
                color: 'text.secondary',
                ml: 'auto',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              })}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <CaretRight size={20} weight="regular" color="currentColor" />
              ) : (
                <CaretLeft size={20} weight="regular" color="currentColor" />
              )}
            </IconButton>
          </Tooltip>
        )}
        {isMobile && onMobileClose && (
          <IconButton
            onClick={onMobileClose}
            size="small"
            sx={(theme) => ({
              color: 'text.secondary',
              ml: 'auto',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
              },
            })}
            aria-label="Close sidebar"
          >
            <CaretLeft size={20} weight="regular" color="currentColor" />
          </IconButton>
        )}
      </Box>

      {/* Scrollable content */}
      <Box
        sx={(theme) => ({
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 2,
          px: 0.5,
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.text.primary, 0.2),
            borderRadius: 4,
            '&:hover': {
              backgroundColor: alpha(theme.palette.text.primary, 0.3),
            },
          },
        })}
      >
        {filteredSections.map((section, sectionIndex) => (
          <Box key={section.title}>
            {!isCollapsed && (
              <Typography
                variant="caption"
                sx={(theme) => ({
                  px: 2.5,
                  py: 1,
                  display: 'block',
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  transition: theme.transitions.create('opacity', {
                    duration: theme.transitions.duration.shorter,
                  }),
                })}
              >
                {section.title}
              </Typography>
            )}
            <List sx={{ px: 0 }}>
              {section.items.map((item) => (
                <NavItemButton key={item.path} item={item} />
              ))}
            </List>
            {sectionIndex < filteredSections.length - 1 && (
              <Divider
                sx={(theme) => ({
                  my: 2,
                  mx: 2,
                  borderColor: theme.palette.divider,
                })}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box
        sx={(theme) => ({
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 1.5,
          flexShrink: 0,
        })}
      >
        {!isCollapsed && user && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 1,
              px: 1,
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 600,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'text.secondary',
                  fontSize: '0.6875rem',
                }}
              >
                {profile?.role === 'ADMIN' ? 'Admin' : 'Staff'}
              </Typography>
            </Box>
          </Box>
        )}
        {isCollapsed && user && (
          <Tooltip title={user.email || 'User'} placement="right">
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </Box>
          </Tooltip>
        )}
        {!isMobile && isCollapsed && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Tooltip title="Expand sidebar" placement="right">
              <IconButton
                onClick={handleToggleCollapse}
                size="small"
                sx={(theme) => ({
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                  },
                })}
                aria-label="Expand sidebar"
              >
                <CaretRight size={20} weight="regular" color="currentColor" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer - temporary variant */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose || (() => {})}
          ModalProps={{
            keepMounted: true,
          }}
          sx={(theme) => ({
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: EXPANDED_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: 'background.paper',
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[8],
            },
          })}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop drawer - permanent variant */}
      <Drawer
        variant="permanent"
        sx={(theme) => ({
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
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
