'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useUserProfile } from '@/hooks/useUserProfile';

type TeamMember = {
  id: string;
  email: string;
  fullName: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
};

const ROLE_OPTIONS: TeamMember['role'][] = ['SUPER_ADMIN', 'ADMIN', 'STAFF'];

export default function TeamManagementPage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const { profile } = useUserProfile();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('ADMIN');
  const [creating, setCreating] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/team');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load team');
      }
      setMembers(data.members || []);
      setInviteEmails(data.inviteEmails || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const updateMember = async (id: string, payload: Partial<Pick<TeamMember, 'role' | 'isActive'>>) => {
    setUpdatingId(id);
    try {
      const response = await fetch('/api/admin/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Update failed');
      }
      setMembers((prev) => prev.map((member) => (member.id === id ? data.member : member)));
      toast.success('Member updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }
    setCreating(true);
    try {
      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }
      toast.success('Member activated');
      setInviteEmail('');
      await loadMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setCreating(false);
    }
  };

  const formattedInvites = useMemo(() => inviteEmails.join(', '), [inviteEmails]);

  return (
    <RouteGuard requireSuperAdmin>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Team
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage roles, access, and invitations for your organization.
          </Typography>
        </Stack>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ mb: 4 }}>
          <Paper sx={{ p: 3, flex: 1, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonAddAlt1Icon color="primary" />
                <Typography variant="h6">Activate member</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                The user must have signed in at least once to create their profile.
              </Typography>
              <TextField
                label="Email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
                fullWidth
              />
              <TextField
                label="Role"
                select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
                fullWidth
              >
                <MenuItem value="STAFF">Staff</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              </TextField>
              <Button
                variant="contained"
                onClick={handleCreateMember}
                disabled={creating}
                startIcon={creating ? <CircularProgress size={18} /> : <PersonAddAlt1Icon />}
              >
                {creating ? t('loading') : 'Activate member'}
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, flex: 1, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Super admin invite list</Typography>
              <Typography variant="body2" color="text.secondary">
                Emails in <code>SUPER_ADMIN_INVITE_EMAILS</code> are auto-promoted on first login.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {inviteEmails.length ? (
                  inviteEmails.map((email) => (
                    <Chip key={email} label={email} variant="outlined" />
                  ))
                ) : (
                  <Chip label="No invite emails set" variant="outlined" />
                )}
              </Box>
              <Button
                variant="outlined"
                onClick={() => {
                  if (!formattedInvites) {
                    toast.error('No invite emails to copy');
                    return;
                  }
                  navigator.clipboard.writeText(formattedInvites).then(() => {
                    toast.success('Copied invite emails');
                  });
                }}
              >
                Copy invite list
              </Button>
            </Stack>
          </Paper>
        </Stack>

        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Team members</Typography>
            <Button
              variant="text"
              startIcon={<RefreshIcon />}
              onClick={loadMembers}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
          <Divider />
          {loading ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member) => {
                    const isSelf = profile?.id === member.id;
                    const isUpdating = updatingId === member.id;
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ width: 36, height: 36 }}>
                              {(member.fullName || member.email || '?')[0]?.toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {member.fullName || '—'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {member.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={member.role}
                            size="small"
                            onChange={(event) =>
                              updateMember(member.id, { role: event.target.value as TeamMember['role'] })
                            }
                            disabled={isUpdating || isSelf}
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <MenuItem key={role} value={role}>
                                {role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Admin' : 'Staff'}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              size="small"
                              label={member.isActive ? 'Active' : 'Pending'}
                              color={member.isActive ? 'success' : 'warning'}
                              variant="outlined"
                            />
                            <Switch
                              size="small"
                              checked={member.isActive}
                              onChange={(event) => updateMember(member.id, { isActive: event.target.checked })}
                              disabled={isUpdating || isSelf}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {new Date(member.createdAt).toLocaleDateString(locale)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </RouteGuard>
  );
}
