import type { Metadata } from 'next';
import './globals.css';
import { cookies } from 'next/headers';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export const metadata: Metadata = {
  title: 'BeautyTrouvailles Stock Management',
  description: 'Stock management system for BeautyTrouvailles',
};

// Root layout - must have <html> and <body> tags
// Locale-specific layout is in [locale]/layout.tsx
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme-mode')?.value;
  const resolvedCookie = cookieStore.get('theme-resolved')?.value;
  const themeAttr =
    themeCookie === 'light' || themeCookie === 'dark'
      ? themeCookie
      : resolvedCookie === 'light' || resolvedCookie === 'dark'
        ? resolvedCookie
        : undefined;
  const themeInitScript = `
(() => {
  const stored = ${JSON.stringify(themeCookie ?? '')};
  const storedResolved = ${JSON.stringify(resolvedCookie ?? '')};
  const mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = mode === 'system'
    ? (storedResolved === 'light' || storedResolved === 'dark' ? storedResolved : (prefersDark ? 'dark' : 'light'))
    : mode;
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
})();
  `;

  return (
    <html data-theme={themeAttr} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={themeAttr === 'dark' ? '#0F172A' : '#F9FAFB'} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppRouterCacheProvider>
          {children}
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
