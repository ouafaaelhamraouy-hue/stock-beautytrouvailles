import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToasterProvider } from '@/components/providers/ToasterProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { routing } from '@/i18n/routing';
import { cookies } from 'next/headers';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme-mode')?.value;
  const resolvedCookie = cookieStore.get('theme-resolved')?.value;
  const initialMode =
    themeCookie === 'light' || themeCookie === 'dark' || themeCookie === 'system'
      ? themeCookie
      : undefined;
  const initialResolvedMode =
    resolvedCookie === 'light' || resolvedCookie === 'dark' ? resolvedCookie : undefined;

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <QueryProvider>
        <ThemeProvider
          locale={locale as 'fr' | 'en'}
          initialMode={initialMode}
          initialResolvedMode={initialResolvedMode}
        >
          <AuthProvider>
            <ToasterProvider />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
