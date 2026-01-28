'use client';

import { Box, Typography, Paper, Tabs, Tab, List, ListItem, ListItemButton, ListItemText, Chip, Divider } from '@mui/material';
import { useState } from 'react';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/routing';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`action-center-tabpanel-${index}`}
      aria-labelledby={`action-center-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export function ActionCenter() {
  const [tabValue, setTabValue] = useState(0);
  const router = useRouter();

  // Use data from aggregated dashboard summary (shared cache)
  const { data: summaryData } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/summary');
      if (!response.ok) throw new Error('Failed to fetch dashboard summary');
      return response.json();
    },
    staleTime: 1000 * 60, // 60 seconds
    gcTime: 1000 * 60 * 5,
  });

  const lowStockData = summaryData?.lowStock || [];
  const topProductsData = summaryData?.topProducts || [];

  // Mock to-do items (you'll need to create an API for this)
  const todoItems = [
    { id: '1', type: 'missing_price', product: 'Product A', message: 'Missing selling price' },
    { id: '2', type: 'missing_category', product: 'Product B', message: 'Missing category' },
    { id: '3', type: 'negative_margin', product: 'Product C', message: 'Negative margin detected' },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  type LowStockItem = { id?: string; name: string; currentStock: number };
  type TopProductItem = { id?: string; name?: string; product?: { name?: string }; totalSold?: number; category?: string };
  const lowStockItems = (lowStockData || []) as LowStockItem[];
  const topProducts = (topProductsData || []) as TopProductItem[];

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      })}
    >
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            fontSize: '1rem',
            letterSpacing: '-0.01em',
            mb: 2,
          }}
        >
          Action Center
        </Typography>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              fontSize: '0.8125rem',
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
            },
          }}
        >
          <Tab label={`Alerts (${lowStockItems.length})`} />
          <Tab label={`Top Sales (${topProducts.length})`} />
          <Tab label={`To-do (${todoItems.length})`} />
        </Tabs>
      </Box>

      <Divider />

      {/* Tab Panels */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Alerts Tab */}
        <TabPanel value={tabValue} index={0}>
          <List sx={{ p: 0 }}>
            {lowStockItems.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No alerts
                </Typography>
              </Box>
            ) : (
              lowStockItems.slice(0, 8).map((item, index: number) => (
                <Box key={item.id || index}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => router.push('/products')}
                      sx={{
                        px: 3,
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                    <WarningIcon
                      sx={{
                        fontSize: 20,
                        color: item.currentStock === 0 ? 'error.main' : 'warning.main',
                        mr: 2,
                      }}
                    />
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {item.currentStock === 0 ? 'Out of stock' : `Only ${item.currentStock} left`}
                        </Typography>
                      }
                    />
                    <Chip
                      label={item.currentStock === 0 ? '0' : item.currentStock}
                      size="small"
                      color={item.currentStock === 0 ? 'error' : 'warning'}
                      sx={{ ml: 1 }}
                    />
                    </ListItemButton>
                  </ListItem>
                  {index < lowStockItems.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </List>
        </TabPanel>

        {/* Top Sales Tab */}
        <TabPanel value={tabValue} index={1}>
          <List sx={{ p: 0 }}>
            {topProducts.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No sales data yet
                </Typography>
              </Box>
            ) : (
              topProducts.map((item, index: number) => (
                <Box key={item.id || index}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => router.push('/products')}
                      sx={{
                        px: 3,
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                    <TrendingUpIcon
                      sx={{
                        fontSize: 20,
                        color: 'success.main',
                        mr: 2,
                      }}
                    />
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {item.name || item.product?.name || 'Unknown'}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {item.totalSold ? `${item.totalSold} sold` : item.category || 'No data'}
                        </Typography>
                      }
                    />
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      sx={{ ml: 1, bgcolor: 'primary.main', color: 'white' }}
                    />
                    </ListItemButton>
                  </ListItem>
                  {index < topProducts.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </List>
        </TabPanel>

        {/* To-do Tab */}
        <TabPanel value={tabValue} index={2}>
          <List sx={{ p: 0 }}>
            {todoItems.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  All tasks completed
                </Typography>
              </Box>
            ) : (
              todoItems.map((item, index) => (
                <Box key={item.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => router.push('/products')}
                      sx={{
                        px: 3,
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                    <AssignmentIcon
                      sx={{
                        fontSize: 20,
                        color: 'warning.main',
                        mr: 2,
                      }}
                    />
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {item.product}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {item.message}
                        </Typography>
                      }
                    />
                    </ListItemButton>
                  </ListItem>
                  {index < todoItems.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </List>
        </TabPanel>
      </Box>
    </Paper>
  );
}
