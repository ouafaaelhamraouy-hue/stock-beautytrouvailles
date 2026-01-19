import { format, formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import numeral from 'numeral';

const locales = {
  en: enUS,
  fr: fr,
};

/**
 * Format currency based on locale and currency type
 */
export function formatCurrency(amount: number, currency: 'EUR' | 'DH', locale: 'en' | 'fr' = 'en'): string {
  if (currency === 'EUR') {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  } else {
    // Moroccan Dirham
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  }
}

/**
 * Format number with locale-aware formatting
 */
export function formatNumber(value: number, locale: 'en' | 'fr' = 'en'): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(value);
}

/**
 * Format date based on locale
 */
export function formatDate(date: Date | string, formatStr: string = 'PP', locale: 'en' | 'fr' = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: locales[locale] });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string, locale: 'en' | 'fr' = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: locales[locale] });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return numeral(value).format(`0.${'0'.repeat(decimals)}%`);
}

/**
 * Format large numbers with abbreviations (e.g., 1.5K, 2.3M)
 */
export function formatCompactNumber(value: number): string {
  return numeral(value).format('0.0a');
}
