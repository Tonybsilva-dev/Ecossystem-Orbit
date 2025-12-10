import { create } from 'zustand';

interface BookingState {
  step: number;
  selectedServiceId: string | null;
  selectedBarberId: string | null;
  selectedDate: Date | null;
  selectedTimeSlot: string | null;

  // Actions
  setService: (serviceId: string) => void;
  setBarber: (barberId: string) => void;
  setDate: (date: Date) => void;
  setTimeSlot: (time: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  step: 1,
  selectedServiceId: null,
  selectedBarberId: null,
  selectedDate: null,
  selectedTimeSlot: null,

  setService: (serviceId) => set({ selectedServiceId: serviceId }),
  setBarber: (barberId) => set({ selectedBarberId: barberId }),
  setDate: (date) => set({ selectedDate: date }),
  setTimeSlot: (time) => set({ selectedTimeSlot: time }),

  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
  reset: () =>
    set({
      step: 1,
      selectedServiceId: null,
      selectedBarberId: null,
      selectedDate: null,
      selectedTimeSlot: null,
    }),
}));
