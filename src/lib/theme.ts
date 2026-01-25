'use client';

import { createTheme } from '@mui/material/styles';
import { frFR, enUS } from '@mui/material/locale';
import { frFR as dataGridFrFR, enUS as dataGridEnUS } from '@mui/x-data-grid/locales';
import { frFR as datePickersFrFR, enUS as datePickersEnUS } from '@mui/x-date-pickers/locales';

export const getTheme = (locale: 'fr' | 'en' = 'en', mode: 'light' | 'dark' = 'light') => {
  const muiLocale = locale === 'fr' ? frFR : enUS;
  const dataGridLocale = locale === 'fr' ? dataGridFrFR : dataGridEnUS;
  const datePickersLocale = locale === 'fr' ? datePickersFrFR : datePickersEnUS;

  const isDark = mode === 'dark';

  return createTheme(
    {
      palette: {
        mode,
        primary: {
          main: '#D4145A', // BeautyTrouvailles pink - used only for CTAs and accents
          light: '#E91E63',
          dark: '#AD1457',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#6366F1', // Indigo for secondary actions
          light: '#818CF8',
          dark: '#4F46E5',
          contrastText: '#ffffff',
        },
        background: {
          default: isDark ? '#0F172A' : '#F9FAFB', // Dark slate or light gray
          paper: isDark ? '#1E293B' : '#FFFFFF', // Dark blue-gray or white
        },
        text: {
          primary: isDark ? '#F1F5F9' : '#111827', // Light gray or almost black
          secondary: isDark ? '#94A3B8' : '#6B7280', // Medium gray
        },
        divider: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        grey: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        error: {
          main: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
        },
        warning: {
          main: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },
        info: {
          main: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
        },
        success: {
          main: '#10B981',
          light: '#34D399',
          dark: '#059669',
        },
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
        h1: {
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1.2,
        },
        h2: {
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
        },
        h3: {
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
        },
        h4: {
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
        },
        h5: {
          fontWeight: 600,
          letterSpacing: '-0.01em',
          lineHeight: 1.4,
        },
        h6: {
          fontWeight: 600,
          letterSpacing: '-0.01em',
          lineHeight: 1.4,
        },
        body1: {
          letterSpacing: '-0.01em',
          lineHeight: 1.6,
        },
        body2: {
          letterSpacing: '-0.01em',
          lineHeight: 1.5,
        },
        button: {
          fontWeight: 500,
          letterSpacing: '-0.01em',
          textTransform: 'none',
        },
        caption: {
          letterSpacing: '0.01em',
          lineHeight: 1.4,
        },
      },
      shape: {
        borderRadius: 12, // Modern, generous rounding
      },
      shadows: [
        'none',
        '0px 1px 2px rgba(0, 0, 0, 0.05)',
        '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
        '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
        '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
        '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
        ...Array(18).fill('0px 25px 50px -12px rgba(0, 0, 0, 0.25)'),
      ],
      components: {
        // Button overrides - clean and professional
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontWeight: 500,
              fontSize: '0.875rem',
              boxShadow: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: 'none',
              },
            },
            contained: {
              background: '#D4145A',
              color: '#FFFFFF',
              '&:hover': {
                background: '#AD1457',
                boxShadow: '0 4px 12px rgba(212, 20, 90, 0.3)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            },
            outlined: {
              borderColor: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.87)',
              '&:hover': {
                borderColor: 'rgba(0, 0, 0, 0.24)',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            },
            text: {
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
            },
          },
        },
        // Card overrides - clean cards
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: isDark
                ? '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
              border: isDark
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            },
          },
        },
        // Paper overrides
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
            elevation0: {
              boxShadow: 'none',
              border: isDark 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.08)',
            },
            elevation1: {
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            },
            elevation2: {
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            },
          },
        },
        // AppBar overrides - white header
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: isDark 
                ? '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
              borderBottom: isDark 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.08)',
            },
          },
        },
        // TextField overrides
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 8,
                transition: 'all 0.2s ease',
                '& fieldset': {
                  borderColor: isDark 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'rgba(0, 0, 0, 0.12)',
                },
                '&:hover fieldset': {
                  borderColor: isDark 
                    ? 'rgba(255, 255, 255, 0.3)' 
                    : 'rgba(0, 0, 0, 0.24)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#D4145A',
                  borderWidth: '1.5px',
                },
              },
            },
          },
        },
        // Chip overrides
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 6,
              fontWeight: 500,
              fontSize: '0.75rem',
            },
            colorPrimary: {
              backgroundColor: '#D4145A',
              color: '#FFFFFF',
            },
          },
        },
        // DataGrid overrides
        MuiDataGrid: {
          styleOverrides: {
            root: {
              border: 'none',
            },
            columnHeaders: {
              borderBottom: isDark 
                ? '2px solid rgba(255, 255, 255, 0.1)' 
                : '2px solid rgba(0, 0, 0, 0.08)',
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            },
            row: {
              '&:nth-of-type(even)': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(249, 250, 251, 1)',
              },
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(243, 244, 246, 1)',
              },
              '&.Mui-selected': {
                backgroundColor: isDark ? 'rgba(212, 20, 90, 0.2)' : 'rgba(212, 20, 90, 0.08)',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(212, 20, 90, 0.25)' : 'rgba(212, 20, 90, 0.12)',
                },
              },
            },
            cell: {
              borderBottom: isDark 
                ? '1px solid rgba(255, 255, 255, 0.08)' 
                : '1px solid rgba(0, 0, 0, 0.06)',
              '&:focus': {
                outline: 'none',
              },
              '&:focus-within': {
                outline: 'none',
              },
            },
            footerContainer: {
              borderTop: isDark 
                ? '2px solid rgba(255, 255, 255, 0.1)' 
                : '2px solid rgba(0, 0, 0, 0.08)',
            },
          },
        },
        // List overrides
        MuiListItem: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
            },
          },
        },
        // IconButton overrides
        MuiIconButton: {
          styleOverrides: {
            root: {
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                transform: 'scale(1.05)',
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
