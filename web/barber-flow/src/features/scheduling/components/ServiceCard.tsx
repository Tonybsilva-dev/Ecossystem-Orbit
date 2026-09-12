import { Coins, Clock } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ServiceCardProps {
  id: string;
  name: string;
  price: number;
  duration: number;
  selected?: boolean;
  onClick?: () => void;
}

export function ServiceCard({ name, price, duration, selected, onClick }: ServiceCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer group relative p-6 border-2 transition-all duration-300 rounded-sm',
        selected
          ? 'border-leather-700 bg-leather-700/10'
          : 'border-leather-800/30 hover:border-leather-500 bg-shop-800/50 hover:bg-shop-800',
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <h3
          className={cn(
            'font-serif text-xl font-bold uppercase tracking-wide',
            selected
              ? 'text-leather-500'
              : 'text-chrome-100 group-hover:text-leather-500 transition-colors',
          )}
        >
          {name}
        </h3>
        {selected && (
          <div className="absolute top-4 right-4 w-3 h-3 bg-leather-700 rounded-full shadow-[0_0_10px_rgba(180,83,9,0.5)]" />
        )}
      </div>

      <div className="flex items-center gap-6 text-sm font-medium text-chrome-400">
        <div className="flex items-center gap-2">
          <Coins size={16} className="text-leather-700" />
          <span>R$ {price.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-leather-700" />
          <span>{duration} min</span>
        </div>
      </div>
    </div>
  );
}
