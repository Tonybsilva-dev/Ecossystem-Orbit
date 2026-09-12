import { cn } from '@/shared/utils/cn';

interface TimeSlotPickerProps {
  slots: string[];
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
}

export function TimeSlotPicker({ slots, selectedSlot, onSelect }: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {slots.map((slot) => (
        <button
          key={slot}
          onClick={() => onSelect(slot)}
          className={cn(
            'py-2 px-4 text-sm font-medium rounded-sm border-2 transition-all',
            selectedSlot === slot
              ? 'border-leather-700 bg-leather-700 text-white shadow-lg scale-105'
              : 'border-leather-800/30 text-chrome-300 hover:border-leather-500 hover:text-white bg-shop-800/50',
          )}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
