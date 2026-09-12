import { cn } from '@/shared/utils/cn';
import { User as UserIcon } from 'lucide-react';

interface BarberCardProps {
  id: string;
  name: string;
  specialties: string[];
  selected?: boolean;
  onClick?: () => void;
}

export function BarberCard({ name, specialties, selected, onClick }: BarberCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer flex flex-col items-center p-6 border-2 transition-all duration-300 rounded-sm gap-4',
        selected
          ? 'border-leather-700 bg-leather-700/10'
          : 'border-leather-800/30 hover:border-leather-500 bg-shop-800/50 hover:bg-shop-800',
      )}
    >
      <div
        className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center border-2',
          selected
            ? 'border-leather-700 bg-leather-700 text-white'
            : 'border-leather-800 bg-shop-900 text-leather-700',
        )}
      >
        <UserIcon size={40} />
      </div>

      <div className="text-center">
        <h3
          className={cn(
            'font-serif text-lg font-bold uppercase tracking-wide mb-1',
            selected ? 'text-leather-500' : 'text-chrome-100',
          )}
        >
          {name}
        </h3>
        <p className="text-xs text-chrome-400 uppercase tracking-widest">
          {specialties.join(' • ')}
        </p>
      </div>
    </div>
  );
}
