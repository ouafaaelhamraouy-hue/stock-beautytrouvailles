'use client';

import { Box } from '@mui/material';

// This layout is nested inside (dashboard)/layout.tsx
// It only provides additional styling/spacing for dashboard-specific pages
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {children}
    </Box>
  );
}
