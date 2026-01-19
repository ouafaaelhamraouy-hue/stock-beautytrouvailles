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
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CurrencyDisplay } from '@/components/ui';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { SaleForm } from './SaleForm';
import { calculateSaleTotal } from '@/lib/calculations';

interface Product {
  id: string;
  sku: string;
  name: string;
  basePriceEUR: number;
  basePriceDH: number;
  availableStock: number;
  category: {
    name: string;
  };
}

interface QuickSaleProps {
  products: Product[];
  onSaleComplete: () => void;
}

export function QuickSale({ products, onSaleComplete }: QuickSaleProps) {
  const t = useTranslations('common');
  const tSales = useTranslations('sales');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [isPromo, setIsPromo] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Set default price when product is selected
  useEffect(() => {
    if (selectedProduct && pricePerUnit === 0) {
      setPricePerUnit(selectedProduct.basePriceEUR);
    }
  }, [selectedProduct, pricePerUnit]);

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

  const handleQuickSale = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    if (quantity > selectedProduct.availableStock) {
      toast.error(tSales('insufficientStock'));
      return;
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
          saleDate: new Date().toISOString(),
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
      setPricePerUnit(0);
      setIsPromo(false);
      
      // Refresh
      onSaleComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create sale');
    }
  };

  const totalAmount = selectedProduct && quantity && pricePerUnit
    ? calculateSaleTotal(quantity, pricePerUnit)
    : 0;

  return (
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
                const product = products.find((p) => p.id === e.target.value);
                if (product) {
                  setPricePerUnit(product.basePriceEUR);
                }
              }}
              fullWidth
              required
            >
              {products.length === 0 ? (
                <MenuItem disabled>No products with stock available</MenuItem>
              ) : (
                products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.sku} - {product.name} (
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
                <TextField
                  label={tSales('pricePerUnit') + ' (EUR)'}
                  type="number"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
                  inputProps={{ step: '0.01', min: 0 }}
                  fullWidth
                  size="small"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Base price: {selectedProduct.basePriceEUR.toFixed(2)} EUR
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="checkbox"
                    id="isPromo"
                    checked={isPromo}
                    onChange={(e) => setIsPromo(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <label htmlFor="isPromo" style={{ cursor: 'pointer' }}>
                    {tSales('isPromo')}
                  </label>
                </Box>
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
                          <CurrencyDisplay amount={totalAmount} currency="EUR" variant="h5" />
                        </Typography>
                      </Box>
                      {selectedProduct && pricePerUnit > 0 && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.9 }}>
                          Margin:{' '}
                          {(
                            ((pricePerUnit - selectedProduct.basePriceEUR) / selectedProduct.basePriceEUR) *
                            100
                          ).toFixed(1)}
                          %
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
                  disabled={!selectedProduct || quantity > selectedProduct.availableStock || quantity < 1}
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
  );
}
