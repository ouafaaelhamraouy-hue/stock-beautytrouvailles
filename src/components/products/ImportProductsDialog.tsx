'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface ImportProductsDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: { sheets: Array<{ sheetName: string; products: any[] }> }) => Promise<void>;
}

interface SheetPreview {
  sheetName: string;
  productCount: number;
  sampleProducts: any[];
}

export function ImportProductsDialog({ open, onClose, onImport }: ImportProductsDialogProps) {
  const t = useTranslations('common');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SheetPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setPreview([]);

    // Check file type
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
    const isCSV = selectedFile.name.endsWith('.csv');

    if (!isExcel && !isCSV) {
      setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    if (isCSV) {
      setError('CSV files only support single sheet import. Please use Excel format for multi-sheet import.');
      return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Filter sheets that start with "COMMANDE" and skip "Charges" and "FOND"
        const commandeSheets = workbook.SheetNames.filter(
          (name) => name.toUpperCase().startsWith('COMMANDE') && 
          name.toUpperCase() !== 'CHARGES' && 
          name.toUpperCase() !== 'FOND'
        );

        if (commandeSheets.length === 0) {
          setError('No sheets starting with "COMMANDE" found. Please ensure your Excel file has sheets named like "COMMANDE 1111", "COMMANDE 1312", etc.');
          return;
        }

        // Process each COMMANDE sheet
        const sheetPreviews: SheetPreview[] = commandeSheets.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Map Excel columns to our format
          const mappedProducts = jsonData.map((row: any, index: number) => {
            const produit = row.Produit || row.produit || row['Produit'] || row.Name || row.name || row.Product || '';
            const paEur = row['PA EUR'] || row['Prix Achat EUR'] || row['Prix EUR'] || row.paEur || row.purchasePriceEur || 0;
            const paMad = row['PA (Prix Achat)'] || row['PA'] || row['Prix Achat'] || row.pa || row.purchasePrice || row['PA MAD'] || 0;
            const pv = row['PV (Prix Vente)'] || row['PV'] || row['Prix Vente'] || row.pv || row.sellingPrice || 0;
            const promo = row['prix promo'] || row['prix promo'] || row['Promo'] || row.promo || row.promoPrice || 0;
            const quantite = row.Quantité || row['Quantité'] || row.Quantite || row.quantity || row.Quantity || 0;
            const qtVendu = row['Qt vendu'] || row['Qt vendu'] || row['Qt Vendu'] || row.qtVendu || row.quantitySold || row['Quantity Sold'] || 0;
            const category = row.Category || row.category || row.Catégorie || row.catégorie || '';

            const purchasePriceEur = parseFloat(paEur) || null;
            const purchasePriceMad = parseFloat(paMad) || 0;
            const sellingPriceDh = parseFloat(pv) || 0;
            const promoPriceDh = parseFloat(promo) || null;
            const quantityReceived = parseInt(quantite) || 0;
            const quantitySold = parseInt(qtVendu) || 0;

            // Skip invalid rows
            const produitStr = produit.toString().trim();
            
            // Skip if Produit is empty/null
            if (!produitStr || produitStr === '') {
              return null;
            }

            // Skip if Produit contains "TOTAL" (case insensitive)
            if (produitStr.toUpperCase().includes('TOTAL')) {
              return null;
            }

            // Skip if PA and Quantité are both empty/null (summary rows)
            if ((!paMad || paMad === 0) && (!purchasePriceEur || purchasePriceEur === 0) && quantityReceived === 0) {
              return null;
            }

            // Skip if all price columns are 0 or empty
            if (purchasePriceMad === 0 && 
                (!purchasePriceEur || purchasePriceEur === 0) && 
                sellingPriceDh === 0 && 
                (!promoPriceDh || promoPriceDh === 0) &&
                quantityReceived === 0) {
              return null;
            }

            // Skip if it's clearly a header row (check if Produit matches common header patterns)
            const headerPatterns = ['PRODUIT', 'PRODUCT', 'NOM', 'NAME', 'ARTICLE'];
            if (headerPatterns.some(pattern => produitStr.toUpperCase() === pattern)) {
              return null;
            }

            return {
              name: produit.toString().trim(),
              purchasePriceEur: purchasePriceEur && purchasePriceEur > 0 ? purchasePriceEur : null,
              purchasePriceMad,
              sellingPriceDh,
              promoPriceDh: promoPriceDh && promoPriceDh > 0 ? promoPriceDh : null,
              quantityReceived,
              quantitySold,
              categoryName: category.toString().trim() || undefined,
            };
          }).filter(Boolean); // Remove nulls

          // Handle two-row pattern: merge products with same name
          const mergedProducts = new Map<string, any>();
          
          mappedProducts.forEach((product: any) => {
            const key = product.name.toLowerCase().trim();
            const existing = mergedProducts.get(key);

            if (existing) {
              mergedProducts.set(key, {
                ...product,
                quantityReceived: existing.quantityReceived + product.quantityReceived,
                quantitySold: existing.quantitySold + product.quantitySold,
                sellingPriceDh: existing.sellingPriceDh || product.sellingPriceDh,
                promoPriceDh: existing.promoPriceDh || product.promoPriceDh,
                purchasePriceEur: existing.purchasePriceEur || product.purchasePriceEur,
                purchasePriceMad: existing.purchasePriceMad || product.purchasePriceMad,
              });
            } else {
              mergedProducts.set(key, product);
            }
          });

          return {
            sheetName,
            productCount: mergedProducts.size,
            sampleProducts: Array.from(mergedProducts.values()).slice(0, 3), // Show first 3 products
          };
        });

        setPreview(sheetPreviews);
        const totalProducts = sheetPreviews.reduce((sum, sheet) => sum + sheet.productCount, 0);
        toast.success(`Found ${commandeSheets.length} shipment(s) with ${totalProducts} total products`);
      } catch (err: any) {
        setError(err.message || 'Failed to parse file');
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) {
      setError('Please select a valid file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Re-read file to get all data
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Filter sheets that start with "COMMANDE"
          const commandeSheets = workbook.SheetNames.filter(
            (name) => name.toUpperCase().startsWith('COMMANDE') && 
            name.toUpperCase() !== 'CHARGES' && 
            name.toUpperCase() !== 'FOND'
          );

          // Process each COMMANDE sheet
          const sheetsData = commandeSheets.map((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Map Excel columns to our format
            const mappedProducts = jsonData.map((row: any) => {
              const produit = row.Produit || row.produit || row['Produit'] || row.Name || row.name || row.Product || '';
              const paEur = row['PA EUR'] || row['Prix Achat EUR'] || row['Prix EUR'] || row.paEur || row.purchasePriceEur || 0;
              const paMad = row['PA (Prix Achat)'] || row['PA'] || row['Prix Achat'] || row.pa || row.purchasePrice || row['PA MAD'] || 0;
              const pv = row['PV (Prix Vente)'] || row['PV'] || row['Prix Vente'] || row.pv || row.sellingPrice || 0;
              const promo = row['prix promo'] || row['prix promo'] || row['Promo'] || row.promo || row.promoPrice || 0;
              const quantite = row.Quantité || row['Quantité'] || row.Quantite || row.quantity || row.Quantity || 0;
              const qtVendu = row['Qt vendu'] || row['Qt vendu'] || row['Qt Vendu'] || row.qtVendu || row.quantitySold || row['Quantity Sold'] || 0;
              const category = row.Category || row.category || row.Catégorie || row.catégorie || '';

              const purchasePriceEur = parseFloat(paEur) || null;
              const purchasePriceMad = parseFloat(paMad) || 0;
              const sellingPriceDh = parseFloat(pv) || 0;
              const promoPriceDh = parseFloat(promo) || null;
              const quantityReceived = parseInt(quantite) || 0;
              const quantitySold = parseInt(qtVendu) || 0;

              // Skip invalid rows
              const produitStr = produit.toString().trim();
              
              // Skip if Produit is empty/null
              if (!produitStr || produitStr === '') {
                return null;
              }

              // Skip if Produit contains "TOTAL" (case insensitive)
              if (produitStr.toUpperCase().includes('TOTAL')) {
                return null;
              }

              // Skip if PA and Quantité are both empty/null (summary rows)
              if ((!purchasePriceMad || purchasePriceMad === 0) && (!purchasePriceEur || purchasePriceEur === 0) && quantityReceived === 0) {
                return null;
              }

              // Skip if all price columns are 0 or empty
              if (purchasePriceMad === 0 && 
                  (!purchasePriceEur || purchasePriceEur === 0) && 
                  sellingPriceDh === 0 && 
                  (!promoPriceDh || promoPriceDh === 0) &&
                  quantityReceived === 0) {
                return null;
              }

              // Skip if it's clearly a header row (check if Produit matches common header patterns)
              const headerPatterns = ['PRODUIT', 'PRODUCT', 'NOM', 'NAME', 'ARTICLE'];
              if (headerPatterns.some(pattern => produitStr.toUpperCase() === pattern)) {
                return null;
              }

              return {
                name: produit.toString().trim(),
                purchasePriceEur: purchasePriceEur && purchasePriceEur > 0 ? purchasePriceEur : null,
                purchasePriceMad,
                sellingPriceDh,
                promoPriceDh: promoPriceDh && promoPriceDh > 0 ? promoPriceDh : null,
                quantityReceived,
                quantitySold,
                categoryName: category.toString().trim() || undefined,
              };
            }).filter(Boolean);

            // Handle two-row pattern: merge products with same name
            const mergedProducts = new Map<string, any>();
            
            mappedProducts.forEach((product: any) => {
              const key = product.name.toLowerCase().trim();
              const existing = mergedProducts.get(key);

              if (existing) {
                mergedProducts.set(key, {
                  ...product,
                  quantityReceived: existing.quantityReceived + product.quantityReceived,
                  quantitySold: existing.quantitySold + product.quantitySold,
                  sellingPriceDh: existing.sellingPriceDh || product.sellingPriceDh,
                  promoPriceDh: existing.promoPriceDh || product.promoPriceDh,
                  purchasePriceEur: existing.purchasePriceEur || product.purchasePriceEur,
                  purchasePriceMad: existing.purchasePriceMad || product.purchasePriceMad,
                });
              } else {
                mergedProducts.set(key, product);
              }
            });

            return {
              sheetName,
              products: Array.from(mergedProducts.values()),
            };
          });

          await onImport({ sheets: sheetsData });
          handleClose();
        } catch (err: any) {
          setError(err.message || 'Failed to import products');
          setLoading(false);
        }
      };

      reader.readAsBinaryString(file);
    } catch (err: any) {
      setError(err.message || 'Failed to import products');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setError(null);
    setLoading(false);
    onClose();
  };

  const totalProducts = preview.reduce((sum, sheet) => sum + sheet.productCount, 0);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
        Import Products from Excel (Multi-Sheet)
        <IconButton onClick={handleClose} size="small" sx={{ ml: 'auto', mr: -1 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ py: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{
                  py: 2,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  '&:hover': {
                    borderStyle: 'dashed',
                    borderWidth: 2,
                  },
                }}
              >
                {file ? file.name : 'Choose Excel file (.xlsx, .xls)'}
              </Button>
            </label>
          </Box>

          {preview.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Found {preview.length} shipment(s) with {totalProducts} total products:
              </Typography>
              {preview.map((sheet, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {sheet.sheetName}
                    </Typography>
                    <Chip label={`${sheet.productCount} products`} size="small" color="primary" />
                  </Box>
                  {sheet.sampleProducts.length > 0 && (
                    <Box sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
                      Sample: {sheet.sampleProducts.map((p: any) => p.name).join(', ')}
                      {sheet.productCount > 3 && '...'}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2" component="div">
              <strong>Expected format:</strong> Excel file with sheets named "COMMANDE 1111", "COMMANDE 1312", etc.
              <br />
              <strong>Each sheet:</strong> Will create a separate Arrivage (shipment) record
              <br />
              <strong>Columns:</strong> Produit, PA (Prix Achat) or PA EUR, PV (Prix Vente), prix promo, Quantité, Qt vendu
              <br />
              <strong>Note:</strong> Sheets named "Charges" and "FOND" will be skipped automatically.
              <br />
              <strong>Products:</strong> If a product with the same name exists, a new product record will be created for this arrivage.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!file || preview.length === 0 || loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Importing...' : `Import ${preview.length} Shipment(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
