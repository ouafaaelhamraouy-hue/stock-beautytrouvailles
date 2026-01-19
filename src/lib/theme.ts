'use client';

import { createTheme } from '@mui/material/styles';
import { frFR, enUS } from '@mui/material/locale';
import { frFR as dataGridFrFR, enUS as dataGridEnUS } from '@mui/x-data-grid/locales';
import { frFR as datePickersFrFR, enUS as datePickersEnUS } from '@mui/x-date-pickers/locales';

export const getTheme = (locale: 'fr' | 'en' = 'en') => {
  const muiLocale = locale === 'fr' ? frFR : enUS;
  const dataGridLocale = locale === 'fr' ? dataGridFrFR : dataGridEnUS;
  const datePickersLocale = locale === 'fr' ? datePickersFrFR : datePickersEnUS;

  return createTheme(
    {
      palette: {
        mode: 'light',
        primary: {
          main: '#1976d2',
          light: '#42a5f5',
          dark: '#1565c0',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#dc004e',
          light: '#e33371',
          dark: '#9a0036',
          contrastText: '#ffffff',
        },
        background: {
          default: '#f5f7fa',
          paper: '#ffffff',
        },
        text: {
          primary: 'rgba(0, 0, 0, 0.87)',
          secondary: 'rgba(0, 0, 0, 0.6)',
        },
        divider: 'rgba(0, 0, 0, 0.12)',
      },
      typography: {
        fontFamily: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ].join(','),
        h4: {
          fontWeight: 600,
          letterSpacing: '-0.02em',
        },
        h5: {
          fontWeight: 600,
          letterSpacing: '-0.01em',
        },
        h6: {
          fontWeight: 600,
        },
        button: {
          fontWeight: 500,
          letterSpacing: '0.02em',
        },
      },
      shape: {
        borderRadius: 8,
      },
      shadows: [
        'none',
        '0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.12)',
        '0px 2px 4px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.12)',
        '0px 3px 6px rgba(0, 0, 0, 0.08), 0px 2px 4px rgba(0, 0, 0, 0.12)',
        '0px 4px 8px rgba(0, 0, 0, 0.08), 0px 2px 6px rgba(0, 0, 0, 0.12)',
        '0px 5px 10px rgba(0, 0, 0, 0.08), 0px 3px 8px rgba(0, 0, 0, 0.12)',
        '0px 6px 12px rgba(0, 0, 0, 0.08), 0px 4px 10px rgba(0, 0, 0, 0.12)',
        '0px 7px 14px rgba(0, 0, 0, 0.08), 0px 5px 12px rgba(0, 0, 0, 0.12)',
        '0px 8px 16px rgba(0, 0, 0, 0.08), 0px 6px 14px rgba(0, 0, 0, 0.12)',
        '0px 9px 18px rgba(0, 0, 0, 0.08), 0px 7px 16px rgba(0, 0, 0, 0.12)',
        '0px 10px 20px rgba(0, 0, 0, 0.08), 0px 8px 18px rgba(0, 0, 0, 0.12)',
        '0px 11px 22px rgba(0, 0, 0, 0.08), 0px 9px 20px rgba(0, 0, 0, 0.12)',
        '0px 12px 24px rgba(0, 0, 0, 0.08), 0px 10px 22px rgba(0, 0, 0, 0.12)',
        '0px 13px 26px rgba(0, 0, 0, 0.08), 0px 11px 24px rgba(0, 0, 0, 0.12)',
        '0px 14px 28px rgba(0, 0, 0, 0.08), 0px 12px 26px rgba(0, 0, 0, 0.12)',
        '0px 15px 30px rgba(0, 0, 0, 0.08), 0px 13px 28px rgba(0, 0, 0, 0.12)',
        '0px 16px 32px rgba(0, 0, 0, 0.08), 0px 14px 30px rgba(0, 0, 0, 0.12)',
        '0px 17px 34px rgba(0, 0, 0, 0.08), 0px 15px 32px rgba(0, 0, 0, 0.12)',
        '0px 18px 36px rgba(0, 0, 0, 0.08), 0px 16px 34px rgba(0, 0, 0, 0.12)',
        '0px 19px 38px rgba(0, 0, 0, 0.08), 0px 17px 36px rgba(0, 0, 0, 0.12)',
        '0px 20px 40px rgba(0, 0, 0, 0.08), 0px 18px 38px rgba(0, 0, 0, 0.12)',
        '0px 21px 42px rgba(0, 0, 0, 0.08), 0px 19px 40px rgba(0, 0, 0, 0.12)',
        '0px 22px 44px rgba(0, 0, 0, 0.08), 0px 20px 42px rgba(0, 0, 0, 0.12)',
        '0px 23px 46px rgba(0, 0, 0, 0.08), 0px 21px 44px rgba(0, 0, 0, 0.12)',
        '0px 24px 48px rgba(0, 0, 0, 0.08), 0px 22px 46px rgba(0, 0, 0, 0.12)',
      ],
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              },
            },
            contained: {
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0px 1px 3px rgba(0,0,0,0.12)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
            elevation1: {
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.12)',
            },
            elevation2: {
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.12)',
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 8,
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            },
          },
        },
      },
    },
    muiLocale,
    dataGridLocale,
    datePickersLocale
  );
};
