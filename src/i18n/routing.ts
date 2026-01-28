import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'fr'],

  // Used when no locale matches
  defaultLocale: 'en',
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

// For dynamic routes, use useParams directly from next/navigation
// Note: In Next.js 15, useParams is a hook that must be used in client components
// Components should import it directly: import { useParams } from 'next/navigation';
