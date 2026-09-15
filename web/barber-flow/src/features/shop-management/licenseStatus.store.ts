import { create } from 'zustand';
import { hc } from 'hono/client';
import type { AppType } from '../../server';

const client = hc<AppType>('/', {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, { ...init, credentials: 'include' }),
});

export type BannerType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'UPDATE';

export interface LicenseBanner {
  id: string;
  type: BannerType;
  message: string;
  link: string | null;
}

interface LicenseStatusState {
  licenseStatus: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TRIAL' | null;
  licenseBlockReason: string | null;
  modules: string[];
  banners: LicenseBanner[];
  isLoading: boolean;
  lastCheckedAt: number | null;

  hasModule: (key: string) => boolean;
  refresh: () => Promise<void>;
}

/**
 * Estado ao vivo do entitlement (licença/módulos/banners), revalidado contra
 * o Orbit via GET /api/barbershop/license-status — nunca lido só do cache
 * local da sessão, que pode estar desatualizado (ver RequireLicense/DashboardLayout).
 */
export const useLicenseStatusStore = create<LicenseStatusState>((set, get) => ({
  licenseStatus: null,
  licenseBlockReason: null,
  modules: [],
  banners: [],
  isLoading: false,
  lastCheckedAt: null,

  hasModule: (key: string) => get().modules.includes(key),

  refresh: async () => {
    set({ isLoading: true });
    try {
      const res = await client.api.barbershop['license-status'].$get();
      if (res.ok) {
        const data = await res.json();
        set({
          licenseStatus: data.licenseStatus,
          licenseBlockReason: data.licenseBlockReason,
          modules: data.modules,
          banners: data.banners,
          lastCheckedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to refresh license status:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
