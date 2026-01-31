'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  MenuItem,
  Chip,
  Typography,
  Alert,
  Grid,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Stack,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CurrencyDisplay } from '@/components/ui';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { calculateSaleTotal } from '@/lib/calculations';

type PriceMode = 'regular' | 'promo' | 'custom';

export interface QuickSaleProduct {
  id: string;
  name: string;
  sellingPriceDh: number;
  promoPriceDh: number | null;
  purchasePriceMad: number;
  availableStock: number;
  quantityReceived: number;
  quantitySold: number;
  category: {
    name: string;
  };
}

interface QuickSaleProps {
  products: QuickSaleProduct[];
  onSaleComplete: () => void;
  initialProductId?: string; // For pre-selecting product from Products page
}

export function QuickSale({ products, onSaleComplete, initialProductId }: QuickSaleProps) {
  const tSales = useTranslations('sales');
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || '');
  const [quantity, setQuantity] = useState(1);
  const [priceMode, setPriceMode] = useState<PriceMode>('regular');
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [isPromo, setIsPromo] = useState(false);
  const [saleDate, setSaleDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState<string>('');

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Set default price when product is selected or price mode changes
  useEffect(() => {
    if (!selectedProduct) {
      setPricePerUnit(0);
      return;
    }

    if (priceMode === 'regular') {
      setPricePerUnit(selectedProduct.sellingPriceDh);
      setIsPromo(false);
    } else if (priceMode === 'promo') {
      if (selectedProduct.promoPriceDh && selectedProduct.promoPriceDh > 0) {
        setPricePerUnit(selectedProduct.promoPriceDh);
        setIsPromo(true);
      } else {
        // No promo price available, switch to custom
        setPriceMode('custom');
        setPricePerUnit(selectedProduct.sellingPriceDh);
        setIsPromo(false);
        toast.warning('No promo price available for this product. Using custom mode.');
      }
    } else {
      // Custom mode - keep current price or use regular as default
      if (pricePerUnit === 0) {
        setPricePerUnit(selectedProduct.sellingPriceDh);
      }
      setIsPromo(false);
    }
  }, [selectedProduct, priceMode, pricePerUnit]);

  // Reset quantity when product changes
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
    }
  }, [selectedProductId, selectedProduct]);

  // Validate quantity against available stock
  useEffect(() => {
    if (selectedProduct && quantity > selectedProduct.availableStock) {
      setQuantity(selectedProduct.availableStock);
      toast.error(`Maximum available: ${selectedProduct.availableStock}`);
    }
  }, [selectedProduct, quantity]);

  const handleIncrement = () => {
    if (selectedProduct && quantity < selectedProduct.availableStock) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handlePriceModeChange = (mode: PriceMode) => {
    setPriceMode(mode);
  };

  const handleQuickSale = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    if (quantity > selectedProduct.availableStock) {
      toast.error(tSales('insufficientStock'));
      return;
    }

    if (pricePerUnit <= 0) {
      toast.error('Price per unit must be greater than 0');
      return;
    }

    // Validate custom price: if custom and price < cost, require notes
    if (priceMode === 'custom' && pricePerUnit < selectedProduct.purchasePriceMad) {
      if (!notes || notes.trim().length === 0) {
        toast.error('Notes are required when selling below cost price');
        return;
      }
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          quantity,
          pricePerUnit,
          isPromo,
          saleDate: saleDate?.toISOString() || new Date().toISOString(),
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create sale');
      }

      toast.success('Sale completed successfully!');
      
      // Reset form
      setSelectedProductId('');
      setQuantity(1);
      setPriceMode('regular');
      setPricePerUnit(0);
      setIsPromo(false);
      setSaleDate(new Date());
      setNotes('');
      
      // Refresh
      onSaleComplete();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create sale');
    }
  };

  const totalAmount = selectedProduct && quantity && pricePerUnit
    ? calculateSaleTotal(quantity, pricePerUnit)
    : 0;

  const margin = selectedProduct && pricePerUnit > 0 && selectedProduct.purchasePriceMad > 0
    ? ((pricePerUnit - selectedProduct.purchasePriceMad) / pricePerUnit) * 100
    : 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: theme.palette.divider,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 32px rgba(0, 0, 0, 0.35)'
              : '0 12px 32px rgba(15, 23, 42, 0.08)',
          })}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="overline" sx={{ fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em' }}>
                    Sale details
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Prepare a quick sale
                  </Typography>
                </Box>

                <TextField
                  select
                  label={tSales('selectProduct')}
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setPriceMode('regular');
                  }}
                  fullWidth
                  required
                >
                  {products.length === 0 ? (
                    <MenuItem disabled>No products with stock available</MenuItem>
                  ) : (
                    products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name}
                      </MenuItem>
                    ))
                  )}
                </TextField>

                {selectedProduct && (
                  <Paper
                    variant="outlined"
                    sx={(theme) => ({
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(0, 0, 0, 0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'wrap',
                    })}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {selectedProduct.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedProduct.category?.name || 'Uncategorized'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip
                        label={`${selectedProduct.availableStock} ${tSales('availableStock')}`}
                        size="small"
                        color={selectedProduct.availableStock > 0 ? 'success' : 'error'}
                      />
                      {selectedProduct.promoPriceDh ? (
                        <Chip label="Promo available" size="small" color="primary" variant="outlined" />
                      ) : null}
                    </Stack>
                  </Paper>
                )}

                {selectedProduct?.availableStock === 0 && (
                  <Alert severity="error">{tSales('insufficientStock')}</Alert>
                )}

                {selectedProduct && (
                  <>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            onClick={handleDecrement}
                            disabled={quantity <= 1}
                            color="primary"
                          >
                            <RemoveIcon />
                          </IconButton>
                          <TextField
                            label={tSales('quantity')}
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setQuantity(Math.min(Math.max(1, val), selectedProduct.availableStock));
                            }}
                            inputProps={{
                              min: 1,
                              max: selectedProduct.availableStock,
                              step: 1,
                            }}
                            sx={{ flexGrow: 1 }}
                            size="small"
                          />
                          <IconButton
                            onClick={handleIncrement}
                            disabled={quantity >= selectedProduct.availableStock}
                            color="primary"
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {tSales('availableStock')}: {selectedProduct.availableStock}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <DatePicker
                          label={tSales('saleDate')}
                          value={saleDate}
                          onChange={(newValue) => setSaleDate(newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                            },
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Price mode
                      </Typography>
                      <ToggleButtonGroup
                        value={priceMode}
                        exclusive
                        onChange={(_, value) => value && handlePriceModeChange(value as PriceMode)}
                        size="small"
                      >
                        <ToggleButton value="regular">Regular</ToggleButton>
                        <ToggleButton
                          value="promo"
                          disabled={!selectedProduct.promoPriceDh || selectedProduct.promoPriceDh <= 0}
                        >
                          Promo
                        </ToggleButton>
                        <ToggleButton value="custom">Custom</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label={tSales('pricePerUnit') + ' (DH)'}
                          type="number"
                          value={pricePerUnit}
                          onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
                          inputProps={{ step: '0.01', min: 0 }}
                          fullWidth
                          size="small"
                          disabled={priceMode !== 'custom'}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {priceMode === 'regular' && `Regular: ${selectedProduct.sellingPriceDh.toFixed(2)} DH`}
                          {priceMode === 'promo' && selectedProduct.promoPriceDh && `Promo: ${selectedProduct.promoPriceDh.toFixed(2)} DH`}
                          {priceMode === 'custom' && `Cost: ${selectedProduct.purchasePriceMad.toFixed(2)} DH`}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Notes (optional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                          helperText={priceMode === 'custom' && pricePerUnit < selectedProduct.purchasePriceMad
                            ? 'Notes required when selling below cost'
                            : 'Add notes for this sale'}
                        />
                      </Grid>
                    </Grid>
                  </>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                variant="outlined"
                sx={(theme) => ({
                  p: 2.5,
                  borderRadius: 3,
                  height: '100%',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(160deg, rgba(212, 20, 90, 0.18), rgba(99, 102, 241, 0.14))'
                    : 'linear-gradient(160deg, rgba(212, 20, 90, 0.08), rgba(99, 102, 241, 0.08))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                })}
              >
                <Box>
                  <Typography variant="overline" sx={{ fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em' }}>
                    Summary
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    <CurrencyDisplay amount={totalAmount || 0} currency="DH" variant="h5" />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedProduct ? `${quantity} × ${pricePerUnit.toFixed(2)} DH` : 'Select a product to continue'}
                  </Typography>
                </Box>

                <Divider />

                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Margin</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedProduct ? `${margin.toFixed(1)}%` : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Stock left</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedProduct ? selectedProduct.availableStock : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Price mode</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedProduct ? priceMode : '—'}
                    </Typography>
                  </Box>
                </Stack>

                {selectedProduct && priceMode === 'custom' && pricePerUnit < selectedProduct.purchasePriceMad && (
                  <Alert severity="warning">Selling below cost requires notes.</Alert>
                )}

                <Box sx={{ mt: 'auto' }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleQuickSale}
                    disabled={
                      !selectedProduct ||
                      quantity > selectedProduct.availableStock ||
                      quantity < 1 ||
                      pricePerUnit <= 0 ||
                      (priceMode === 'custom' && pricePerUnit < selectedProduct.purchasePriceMad && !notes.trim())
                    }
                    sx={{
                      py: 1.3,
                      fontWeight: 700,
                      boxShadow: '0 6px 18px rgba(212, 20, 90, 0.3)',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(212, 20, 90, 0.4)',
                      },
                    }}
                  >
                    Complete Sale
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
