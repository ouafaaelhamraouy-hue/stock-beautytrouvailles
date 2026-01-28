'use client';

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ShipmentHeader } from './ShipmentHeader';
import { CurrencyDisplay } from '@/components/ui';
import { PurchaseSource } from '@prisma/client';

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  purchasePriceMad: number;
  sellingPriceDh: number;
  promoPriceDh: number | null;
  stock: number;
  sold: number;
  margin: number;
  reorderLevel: number;
}

interface ShipmentAccordionProps {
  reference: string;
  shipDate: string | null;
  source: PurchaseSource;
  totalProducts: number;
  totalValue: number;
  products: Product[];
  defaultExpanded?: boolean;
}

export function ShipmentAccordion({
  reference,
  shipDate,
  source,
  totalProducts,
  totalValue,
  products,
  defaultExpanded = false,
}: ShipmentAccordionProps) {
  const getStockColor = (stock: number, reorderLevel: number) => {
    if (stock === 0) return 'error';
    if (stock <= reorderLevel) return 'warning';
    return 'success';
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 50) return 'success';
    if (margin >= 30) return 'warning';
    return 'error';
  };

  return (
    <Accordion defaultExpanded={defaultExpanded} sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: 'background.paper',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <ShipmentHeader
          reference={reference}
          shipDate={shipDate}
          source={source}
          totalProducts={totalProducts}
          totalValue={totalValue}
        />
      </AccordionSummary>
      <AccordionDetails>
        {products.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
            Aucun produit dans cet arrivage
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Produit</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Catégorie</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">PA (DH)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">PV (DH)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Promo (DH)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Stock</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Vendu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Marge</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {product.name}
                        </Typography>
                        {product.brand && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {product.brand}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell align="right">
                      <CurrencyDisplay amount={product.purchasePriceMad || 0} currency="DH" />
                    </TableCell>
                    <TableCell align="right">
                      <CurrencyDisplay amount={product.sellingPriceDh || 0} currency="DH" />
                    </TableCell>
                    <TableCell align="right">
                      {product.promoPriceDh ? (
                        <CurrencyDisplay amount={product.promoPriceDh} currency="DH" />
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={product.stock}
                        size="small"
                        color={getStockColor(product.stock, product.reorderLevel)}
                        variant={product.stock === 0 ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">{product.sold}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${product.margin.toFixed(1)}%`}
                        size="small"
                        color={getMarginColor(product.margin)}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
