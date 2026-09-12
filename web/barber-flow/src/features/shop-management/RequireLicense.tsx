import { Outlet } from 'react-router';
import { LicenseBlockedPage } from './LicenseBlockedPage';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/features/auth/client';

export function RequireLicense() {
  const { data: session, isPending: isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-leather-500" size={24} />
      </div>
    );
  }

  // @ts-expect-error - extended session type
  const licenseStatus = session?.user?.barbershop?.licenseStatus;

  // If no session or license is NOT active, show blocked page.
  // Note: We might want to allow if strictly 'ACTIVE'.
  if (!licenseStatus || licenseStatus !== 'ACTIVE') {
    return <LicenseBlockedPage />;
  }

  return <Outlet />;
}
