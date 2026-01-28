'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, Paper, Grid, TextField, MenuItem } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ExpensesTable } from '@/components/expenses/ExpensesTable';
import { LoadingState, ErrorState, StatsCard } from '@/components/ui';
import { CurrencyDisplay } from '@/components/ui';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { PieChart } from '@mui/x-charts/PieChart';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { format } from 'date-fns';

interface Expense {
  id: string;
  date: string;
  amountEUR: number | DecimalLike; // Can be Decimal
  amountDH: number | DecimalLike; // Can be Decimal
  description: string;
  type: 'OPERATIONAL' | 'MARKETING' | 'UTILITIES' | 'PACKAGING' | 'SHIPPING' | 'ADS' | 'OTHER';
  shipmentId?: string | null;
  arrivageId?: string | null;
  shipment?: {
    id: string;
    reference: string;
    supplier: {
      name: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Arrivage {
  id: string;
  reference: string;
}

type DecimalLike = { toNumber: () => number };
type ShipmentListItem = { id: string; reference: string };
type ExpenseType = Expense['type'];

// Helper to convert Decimal to number
const toNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'object' && 'toNumber' in value) {
    return (value as DecimalLike).toNumber();
  }
  return 0;
};

export default function ExpensesPage() {
  const t = useTranslations('nav');
  const tExpenses = useTranslations('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [arrivages, setArrivages] = useState<Arrivage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [arrivageFilter, setArrivageFilter] = useState<string>('');

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (arrivageFilter) {
        params.append('arrivageId', arrivageFilter);
      }
      if (typeFilter) {
        params.append('type', typeFilter);
      }
      if (startDate) {
        params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      }

      const response = await fetch(`/api/expenses?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      setExpenses(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [arrivageFilter, typeFilter, startDate, endDate]);

  const fetchArrivages = useCallback(async () => {
    try {
      const response = await fetch('/api/shipments');
      if (!response.ok) {
        throw new Error('Failed to fetch arrivages');
      }
      const data = await response.json();
      // Handle both old format (array) and new format (object with shipments)
      const shipments = (Array.isArray(data) ? data : (data.shipments || [])) as ShipmentListItem[];
      setArrivages(
        shipments.map((s) => ({
          id: s.id,
          reference: s.reference,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch arrivages:', err);
      setArrivages([]);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchArrivages();
  }, [fetchExpenses, fetchArrivages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchExpenses]);

  const handleRefresh = () => {
    fetchExpenses();
  };

  // Calculate totals (handle Decimal types)
  const totalExpensesEUR = expenses.reduce((sum, expense) => sum + toNumber(expense.amountEUR), 0);
  const totalExpensesDH = expenses.reduce((sum, expense) => sum + toNumber(expense.amountDH), 0);

  // Calculate expenses by type for pie chart
  const expensesByType = expenses.reduce((acc, expense) => {
    const type = expense.type;
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type] += toNumber(expense.amountEUR);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByType).map(([type, amount]) => ({
    id: type,
    value: amount,
    label: tExpenses(type.toLowerCase() as Lowercase<ExpenseType>) || type,
  }));

  if (loading && expenses.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('expenses')}
          </Typography>
          <LoadingState variant="table" rows={5} />
        </Box>
      </Container>
    );
  }

  if (error && expenses.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {t('expenses')}
          </Typography>
          <ErrorState message={error} onRetry={fetchExpenses} />
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('expenses')}
          </Typography>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatsCard
                title={tExpenses('totalExpenses')}
                value={<CurrencyDisplay amount={totalExpensesEUR} currency="EUR" variant="h4" />}
                icon={<AttachMoneyIcon sx={{ fontSize: 40 }} />}
                color="#d32f2f"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatsCard
                title={tExpenses('totalExpenses') + ' (DH)'}
                value={<CurrencyDisplay amount={totalExpensesDH} currency="DH" variant="h4" />}
                icon={<ReceiptIcon sx={{ fontSize: 40 }} />}
                color="#ed6c02"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatsCard
                title="Total Count"
                value={expenses.length}
                icon={<ReceiptIcon sx={{ fontSize: 40 }} />}
                color="#9c27b0"
              />
            </Grid>
          </Grid>

          {/* Expenses by Type Chart */}
          {pieData.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {tExpenses('byType')}
              </Typography>
              <Box sx={{ height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <PieChart
                  series={[
                    {
                      data: pieData,
                      innerRadius: 30,
                      outerRadius: 100,
                      paddingAngle: 2,
                      cornerRadius: 5,
                    },
                  ]}
                  width={400}
                  height={400}
                />
              </Box>
            </Paper>
          )}

          {/* Filters */}
          <Paper 
            elevation={2}
            sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ minWidth: 180 }}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 180 }}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Box>
              <TextField
                select
                label={tExpenses('type')}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{ minWidth: 180 }}
                size="small"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="OPERATIONAL">{tExpenses('operational')}</MenuItem>
                <MenuItem value="MARKETING">{tExpenses('marketing')}</MenuItem>
                <MenuItem value="UTILITIES">{tExpenses('utilities')}</MenuItem>
                <MenuItem value="PACKAGING">{tExpenses('packaging')}</MenuItem>
                <MenuItem value="SHIPPING">{tExpenses('shipping')}</MenuItem>
                <MenuItem value="ADS">{tExpenses('ads')}</MenuItem>
                <MenuItem value="OTHER">{tExpenses('other')}</MenuItem>
              </TextField>
              <TextField
                select
                label={tExpenses('shipment')}
                value={arrivageFilter}
                onChange={(e) => setArrivageFilter(e.target.value)}
                sx={{ minWidth: 200 }}
                size="small"
              >
                <MenuItem value="">All Arrivages</MenuItem>
                {arrivages.map((arrivage) => (
                  <MenuItem key={arrivage.id} value={arrivage.id}>
                    {arrivage.reference}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Paper>

          {/* Expenses Table */}
          <Paper 
            elevation={2}
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <ExpensesTable
              expenses={expenses}
              shipments={arrivages.map(a => ({ id: a.id, reference: a.reference, supplier: { name: '' } }))}
              onRefresh={handleRefresh}
            />
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
}
