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
  Card,
  CardContent,
  Grid,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
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

interface Product {
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
  products: Product[];
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
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            {tSales('quickSale')}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                label={tSales('selectProduct')}
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setPriceMode('regular'); // Reset to regular when product changes
                }}
                fullWidth
                required
              >
                {products.length === 0 ? (
                  <MenuItem disabled>No products with stock available</MenuItem>
                ) : (
                  products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} (
                      <Chip
                        label={`${product.availableStock} ${tSales('availableStock')}`}
                        size="small"
                        color={product.availableStock > 0 ? 'success' : 'error'}
                        sx={{ ml: 1, height: 20 }}
                      />
                      )
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            {selectedProduct && (
              <>
                {selectedProduct.availableStock === 0 && (
                  <Grid item xs={12}>
                    <Alert severity="error">{tSales('insufficientStock')}</Alert>
                  </Grid>
                )}

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

                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Price Mode</FormLabel>
                    <RadioGroup
                      row
                      value={priceMode}
                      onChange={(e) => handlePriceModeChange(e.target.value as PriceMode)}
                    >
                      <FormControlLabel value="regular" control={<Radio />} label="Regular" />
                      <FormControlLabel 
                        value="promo" 
                        control={<Radio />} 
                        label="Promo"
                        disabled={!selectedProduct.promoPriceDh || selectedProduct.promoPriceDh <= 0}
                      />
                      <FormControlLabel value="custom" control={<Radio />} label="Custom" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

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

                {totalAmount > 0 && (
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {tSales('totalAmount')}:
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            <CurrencyDisplay amount={totalAmount} currency="DH" variant="h5" />
                          </Typography>
                        </Box>
                        {selectedProduct && pricePerUnit > 0 && (
                          <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.9 }}>
                            Margin: {margin.toFixed(1)}%
                            {priceMode === 'custom' && pricePerUnit < selectedProduct.purchasePriceMad && (
                              <span style={{ color: '#ffcdd2', marginLeft: 8 }}>⚠ Below cost</span>
                            )}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                <Grid item xs={12}>
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
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(25, 118, 210, 0.5)',
                      },
                    }}
                  >
                    Complete Sale
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
