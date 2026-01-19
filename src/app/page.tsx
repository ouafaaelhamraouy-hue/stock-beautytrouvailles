import { redirect } from 'next/navigation';

// Root page - redirect to locale-based routing
export default function RootPage() {
  redirect('/en');
}
