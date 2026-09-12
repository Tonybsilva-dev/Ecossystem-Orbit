import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserLocation {
  latitude?: number;
  longitude?: number;
  city: string;
  state: string; // UF sigla (e.g., SP, RJ)
  method: 'GPS' | 'MANUAL';
}

interface MarketplaceState {
  location: UserLocation | null;
  setLocation: (location: UserLocation) => void;
  clearLocation: () => void;
  isLocationModalOpen: boolean;
  setLocationModalOpen: (isOpen: boolean) => void;
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set) => ({
      location: null,
      isLocationModalOpen: false,

      setLocation: (location) => set({ location, isLocationModalOpen: false }),
      clearLocation: () => set({ location: null }),
      setLocationModalOpen: (isOpen) => set({ isLocationModalOpen: isOpen }),
    }),
    {
      name: 'barberflow-marketplace-storage',
    },
  ),
);
