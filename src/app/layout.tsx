import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BeautyTrouvailles Stock Management',
  description: 'Stock management system for BeautyTrouvailles',
};

// Root layout - must have <html> and <body> tags
// Locale-specific layout is in [locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}
