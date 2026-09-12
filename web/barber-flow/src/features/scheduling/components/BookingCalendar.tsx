import { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface BookingCalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}

export function BookingCalendar({ selectedDate, onSelect }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const weekDays = ['Don', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-shop-800/30 p-4 rounded-sm border border-leather-800/30">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={prevMonth}
          disabled={isBefore(currentMonth, startOfMonth(new Date()))} // Disable going back to past months
          className="p-2 text-chrome-400 hover:text-white disabled:opacity-30 disabled:hover:text-chrome-400"
        >
          <ChevronLeft size={20} />
        </button>

        <h3 className="font-serif font-bold text-lg text-chrome-100 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>

        <button onClick={nextMonth} className="p-2 text-chrome-400 hover:text-white">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-leather-700 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isPast = isBefore(day, today);
          const isDayToday = isToday(day);

          return (
            <button
              key={idx}
              onClick={() => !isPast && onSelect(day)}
              disabled={isPast || !isCurrentMonth}
              className={cn(
                'h-10 w-full flex items-center justify-center rounded-sm text-sm transition-all relative overflow-hidden',
                !isCurrentMonth ? 'invisible' : 'visible',
                isSelected
                  ? 'bg-leather-700 text-white font-bold shadow-md'
                  : isPast
                    ? 'text-chrome-400/30 cursor-not-allowed'
                    : 'text-chrome-300 hover:bg-leather-700/20 hover:text-white',
                isDayToday && !isSelected && 'border border-leather-700/50',
              )}
            >
              {format(day, 'd')}
              {isDayToday && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-leather-500"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
