import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { hc } from 'hono/client';
import type { AppType } from '../../server';

// Client for Hono API
// Client for Hono API with Credentials for Session persistence
const client = hc<AppType>('/', {
  fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
});

export interface BarbershopState {
  data: {
    id?: string;
    name: string;
    cnpj?: string | null;
    phone?: string | null;
    address?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    licenseKey?: string | null;
    licenseStatus: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TRIAL' | string;
    planType?: 'BASIC' | 'PRO' | 'ENTERPRISE' | 'TRIAL' | 'FREE' | string;
    modules?: string[];
    createdAt?: string;
    updatedAt?: string;
  } | null;
  isLoading: boolean;

  fetchBarbershop: () => Promise<void>;
  updateBarbershop: (data: Partial<BarbershopState['data']>) => Promise<void>;
  isOnboardingComplete: () => boolean;
}

export const useBarbershopStore = create<BarbershopState>()(
  persist(
    (set, get) => ({
      data: null,
      isLoading: false,

      fetchBarbershop: async () => {
        set({ isLoading: true });
        try {
          const res = await client.api.barbershop.$get();
          if (res.ok) {
            const data = await res.json();
            set({ data });
          }
        } catch (error) {
          console.error('Failed to fetch barbershop:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateBarbershop: async (newData) => {
        set({ isLoading: true });
        try {
          const res = await client.api.barbershop.$post({ json: newData as any });
          if (res.ok) {
            const updated = await res.json();
            set({ data: updated });
          }
        } catch (error) {
          console.error('Failed to update barbershop:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      isOnboardingComplete: () => {
        const { data } = get();
        return !!(data?.name && data?.cnpj && data?.licenseStatus === 'ACTIVE');
      },
    }),
    {
      name: 'barberflow-shop-config',
    },
  ),
);
