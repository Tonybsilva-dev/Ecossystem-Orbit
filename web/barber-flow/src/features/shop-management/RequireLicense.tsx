import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { LicenseBlockedPage } from './LicenseBlockedPage';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/features/auth/client';
import { useLicenseStatusStore } from './licenseStatus.store';

/**
 * Gate de licença: nunca decide só pelo cache da sessão (populado uma vez no
 * onboarding) — revalida contra o Orbit ao montar. Enquanto a revalidação não
 * chega, usa o valor da sessão como palpite otimista pra evitar flicker; a
 * fonte de verdade é sempre o `licenseStatus` da store depois do primeiro refresh.
 */
export function RequireLicense() {
  const { data: session, isPending: isSessionLoading } = useSession();
  const { licenseStatus, licenseBlockReason, lastCheckedAt, refresh } = useLicenseStatusStore();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-leather-500" size={24} />
      </div>
    );
  }

  // @ts-expect-error - extended session type
  const sessionLicenseStatus = session?.user?.barbershop?.licenseStatus;
  const effectiveStatus = lastCheckedAt ? licenseStatus : sessionLicenseStatus;

  if (!effectiveStatus || effectiveStatus !== 'ACTIVE') {
    return <LicenseBlockedPage reason={lastCheckedAt ? licenseBlockReason : null} />;
  }

  return <Outlet />;
}
