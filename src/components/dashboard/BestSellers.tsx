'use client';

import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Chip,
  Avatar,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useQuery } from '@tanstack/react-query';

interface BestSeller {
  name: string;
  totalSold: number;
  category?: string;
}

export function BestSellers() {
  const { data, isLoading } = useQuery({
    queryKey: ['bestSellers'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/top-products?limit=5');
      if (!response.ok) throw new Error('Failed to fetch best sellers');
      const data = await response.json();
      return data.products || [];
    },
  });

  const cardStyle = (theme: any) => ({
    elevation: 0,
    p: 4,
    borderRadius: 2,
    border: '1px solid',
    borderColor: theme.palette.divider,
    backgroundColor: theme.palette.background.paper,
    height: '100%',
  });

  if (isLoading) {
    return (
      <Paper sx={(theme) => cardStyle(theme)}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '-0.01em', color: 'text.primary' }}>
          <EmojiEventsIcon sx={{ color: 'warning.main', fontSize: '20px' }} />
          Meilleures Ventes
        </Typography>
        <Box sx={{ py: 2 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Box 
              key={i} 
              sx={(theme) => ({ 
                height: 48, 
                mb: 1.5, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.100', 
                borderRadius: 2 
              })} 
            />
          ))}
        </Box>
      </Paper>
    );
  }

  const bestSellers: BestSeller[] = data || [];

  if (bestSellers.length === 0) {
    return (
      <Paper sx={(theme) => cardStyle(theme)}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '-0.01em', color: 'text.primary' }}>
          <EmojiEventsIcon sx={{ color: 'warning.main', fontSize: '20px' }} />
          Meilleures Ventes
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
          Aucune vente enregistrée
        </Typography>
      </Paper>
    );
  }

  const getRankColor = (index: number, theme: any) => {
    if (index === 0) return { bg: '#FFD700', color: '#000' }; // Gold
    if (index === 1) return { bg: '#C0C0C0', color: '#000' }; // Silver
    if (index === 2) return { bg: '#CD7F32', color: '#FFF' }; // Bronze
    return { 
      bg: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'grey.200', 
      color: 'text.primary' 
    };
  };

  return (
    <Paper sx={(theme) => cardStyle(theme)}>
        <Typography variant="h6" sx={{ mb: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: '-0.01em', color: 'text.primary' }}>
          <EmojiEventsIcon sx={{ color: 'warning.main', fontSize: '22px' }} />
          Meilleures Ventes
        </Typography>
      <List sx={{ p: 0 }}>
        {bestSellers.map((product, index) => {
          return (
            <ListItem
              key={product.name}
              sx={(theme) => ({
                px: 0,
                py: 1.5,
                borderRadius: 2,
                mb: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'grey.50',
                  transform: 'translateX(4px)',
                },
              })}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Avatar
                  sx={(theme) => {
                    const rankColor = getRankColor(index, theme);
                    return {
                      width: 40,
                      height: 40,
                      bgcolor: rankColor.bg,
                      color: rankColor.color,
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      border: index < 3 ? '2px solid' : 'none',
                      borderColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'transparent',
                    };
                  }}
                >
                  {index + 1}
                </Avatar>
                <ListItemText
                  primary={product.name}
                  secondary={product.category || 'Uncategorized'}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: index < 3 ? 600 : 500,
                    color: 'text.primary',
                    letterSpacing: '-0.01em',
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                  }}
                  sx={{ flex: 1 }}
                />
                <Chip
                  label={product.totalSold}
                  size="small"
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    minWidth: 48,
                    height: 28,
                  }}
                />
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}
