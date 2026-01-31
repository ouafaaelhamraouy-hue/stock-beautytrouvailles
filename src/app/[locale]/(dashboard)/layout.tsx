'use client';

import { Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { RouteGuard } from '@/components/auth/RouteGuard';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 72;
const STORAGE_KEY = 'sidebar-collapsed';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    setCollapsed(stored === 'true');
  }, []);

  // Listen for storage changes to sync sidebar state (cross-tab)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      setCollapsed(stored === 'true');
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
      return;
    }
    handleToggleCollapse();
  };

  // Close mobile drawer when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  const handleToggleCollapse = () => {
    // Only toggle collapse on desktop
    if (isMobile) return;
    
    setCollapsed((prev) => {
      const newCollapsed = !prev;
      
      // Persist to localStorage immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(newCollapsed));
      }
      
      return newCollapsed;
    });
  };

  const drawerWidth = isMobile ? EXPANDED_WIDTH : (collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH);

  return (
    <RouteGuard>
      <Box 
        sx={{ 
          display: 'flex', 
          minHeight: '100vh', 
          backgroundColor: 'background.default',
        }}
      >
        <CssBaseline />
        <Topbar onMenuClick={handleDrawerToggle} />
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={handleDrawerClose}
          isMobile={isMobile}
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            width: {
              xs: '100%',
              md: `calc(100% - ${drawerWidth}px)`,
            },
            mt: { xs: '56px', sm: '64px' },
            mb: { xs: '56px', md: 0 },
            backgroundColor: 'background.default',
            maxWidth: '100%',
            overflowX: 'auto',
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          {children}
        </Box>
        <MobileNav />
      </Box>
    </RouteGuard>
  );
}
