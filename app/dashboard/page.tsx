import { redirect } from 'next/navigation';

// Keep the legacy URL from opening a second, out-of-date parent dashboard.
// The authenticated parent experience lives at the root portal.
export default function LegacyDashboardRedirect() {
  redirect('/');
}
