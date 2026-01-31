'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { toast } from 'sonner';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasPermission, isAdmin as isAdminRole } from '@/lib/permissions';
import { RouteGuard } from '@/components/auth/RouteGuard';

interface Settings {
  packagingCostPlastic: number;
  packagingCostCarton: number;
  packagingCostStickers: number;
  packagingCostTotal: number;
  adsCostMonthly: number;
  exchangeRateEurToMad: number;
}

const DEFAULT_SETTINGS: Settings = {
  packagingCostPlastic: 1.50,
  packagingCostCarton: 6.00,
  packagingCostStickers: 0.50,
  packagingCostTotal: 8.00,
  adsCostMonthly: 150.00,
  exchangeRateEurToMad: 10.85,
};

export default function SettingsPage() {
  const { profile } = useUserProfile();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = profile ? isAdminRole(profile.role) : false;
  const canEdit = isAdmin && hasPermission(profile?.role || 'STAFF', 'PRODUCTS_UPDATE');

  useEffect(() => {
    fetchSettings();
  }, []);

  // Auto-calculate total packaging cost
  useEffect(() => {
    const total = settings.packagingCostPlastic + settings.packagingCostCarton + settings.packagingCostStickers;
    if (total !== settings.packagingCostTotal) {
      setSettings(prev => ({ ...prev, packagingCostTotal: parseFloat(total.toFixed(2)) }));
    }
  }, [
    settings.packagingCostPlastic,
    settings.packagingCostCarton,
    settings.packagingCostStickers,
    settings.packagingCostTotal,
  ]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.settings);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to load settings');
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to update settings');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      const data = await response.json();
      setSettings(data.settings);
      toast.success('Settings saved successfully');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    toast.info('Settings reset to defaults');
  };

  const handleChange = (key: keyof Settings, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSettings(prev => ({ ...prev, [key]: numValue }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <RouteGuard requireAdmin>
    <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
        <Box>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              color: 'text.primary', 
              letterSpacing: '-0.03em',
              mb: 1,
            }}
          >
            Paramètres
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: '-0.01em' }}>
            Configuration des coûts et taux de change
          </Typography>
        </Box>

        {canEdit && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleReset}
              disabled={saving}
            >
              Réinitialiser
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Stack>
        )}
      </Stack>

      {!canEdit && (
        <Alert severity="info" sx={{ mb: 4 }}>
          Vous n&apos;avez pas la permission de modifier ces paramètres. Contactez un administrateur.
        </Alert>
      )}

      {/* Packaging Costs Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          mb: 4,
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3, 
            fontWeight: 600, 
            letterSpacing: '-0.01em',
            color: 'text.primary',
          }}
        >
          📦 Coûts d&apos;emballage (DH)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Ces coûts sont ajoutés à chaque vente pour calculer la marge nette. Source: Feuille &quot;Charges&quot; Excel.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Plastique"
              type="number"
              value={settings.packagingCostPlastic}
              onChange={(e) => handleChange('packagingCostPlastic', e.target.value)}
              disabled={!canEdit}
              inputProps={{ step: '0.01', min: '0' }}
              InputProps={{
                endAdornment: <Typography variant="body2" color="text.secondary">DH</Typography>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Emballage Carton"
              type="number"
              value={settings.packagingCostCarton}
              onChange={(e) => handleChange('packagingCostCarton', e.target.value)}
              disabled={!canEdit}
              inputProps={{ step: '0.01', min: '0' }}
              InputProps={{
                endAdornment: <Typography variant="body2" color="text.secondary">DH</Typography>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Stickers"
              type="number"
              value={settings.packagingCostStickers}
              onChange={(e) => handleChange('packagingCostStickers', e.target.value)}
              disabled={!canEdit}
              inputProps={{ step: '0.01', min: '0' }}
              InputProps={{
                endAdornment: <Typography variant="body2" color="text.secondary">DH</Typography>,
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ 
          p: 3, 
          bgcolor: 'action.hover', 
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Total par vente
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {settings.packagingCostTotal.toFixed(2)} DH
          </Typography>
        </Box>
      </Paper>

      {/* Marketing & Operations Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          mb: 4,
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3, 
            fontWeight: 600, 
            letterSpacing: '-0.01em',
            color: 'text.primary',
          }}
        >
          📊 Marketing & Opérations
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Coût publicité mensuel"
              type="number"
              value={settings.adsCostMonthly}
              onChange={(e) => handleChange('adsCostMonthly', e.target.value)}
              disabled={!canEdit}
              inputProps={{ step: '1', min: '0' }}
              helperText="Coût mensuel pour les publicités (ADS)"
              InputProps={{
                endAdornment: <Typography variant="body2" color="text.secondary">DH</Typography>,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Exchange Rate Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3, 
            fontWeight: 600, 
            letterSpacing: '-0.01em',
            color: 'text.primary',
          }}
        >
          💱 Taux de change
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="EUR → MAD"
              type="number"
              value={settings.exchangeRateEurToMad}
              onChange={(e) => handleChange('exchangeRateEurToMad', e.target.value)}
              disabled={!canEdit}
              inputProps={{ step: '0.01', min: '0' }}
              helperText="Taux de conversion Euro vers Dirham marocain"
            />
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 3 }}>
          Ce taux est utilisé pour convertir les coûts EUR en DH lors de l&apos;import des arrivages.
        </Alert>
      </Paper>
    </Box>
    </RouteGuard>
  );
}
