'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function MakeAdminPage() {
  const t = useTranslations('common');
  const { profile } = useUserProfile();
  const [email, setEmail] = useState('ouafaa.elhamraouy@gmail.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleMakeAdmin = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: `✅ User ${data.user.email} is now an ADMIN!`,
        });
        toast.success('Admin user created successfully');
        setEmail('');
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to create admin user',
        });
        toast.error(data.error || 'Failed to create admin user');
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'An error occurred',
      });
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Make User Admin
        </Typography>

        <Paper elevation={2} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="User Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              placeholder="user@example.com"
              helperText="Enter the email of the user to make admin"
            />

            {result && (
              <Alert severity={result.success ? 'success' : 'error'}>
                {result.message}
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={handleMakeAdmin}
              disabled={loading || !email}
              fullWidth
              sx={{
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                },
              }}
            >
              {loading ? t('loading') : 'Make Admin'}
            </Button>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> The user must:
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>Exist in Supabase Auth</li>
                  <li>Have logged in at least once (to create their profile)</li>
                </ul>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
