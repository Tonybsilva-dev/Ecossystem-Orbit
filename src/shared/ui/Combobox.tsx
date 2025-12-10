import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface Option {
  label: string;
  value: string;
}

interface ComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  disabled = false,
  className,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearch(''); // Reset search on close
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left rounded-md border transition-all duration-200 outline-none select-none',
          'bg-shop-900 border-leather-800/30 text-chrome-100', // Default state
          'hover:border-leather-600 focus:border-leather-500', // Hover/Focus
          isOpen && 'border-leather-500 ring-1 ring-leather-500/20', // Active state
          disabled && 'opacity-50 cursor-not-allowed bg-shop-900/50', // Disabled
        )}
      >
        <span className={cn('block truncate', !selectedOption && 'text-chrome-500')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-chrome-500 transition-transform duration-300',
            isOpen && 'rotate-180 text-leather-500',
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-2 overflow-hidden bg-shop-800 border border-leather-800/50 rounded-md shadow-2xl shadow-black/50"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-leather-800/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-chrome-600" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-shop-900/50 border border-transparent rounded text-chrome-100 placeholder-chrome-600 focus:outline-none focus:border-leather-600/50 transition-colors"
                />
              </div>
            </div>

            {/* Options List */}
            <ul className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'relative flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors',
                      'hover:bg-leather-700/20 hover:text-leather-400', // Default hover
                      value === option.value
                        ? 'bg-leather-700/10 text-leather-500 font-medium' // Selected
                        : 'text-chrome-300', // Normal
                    )}
                  >
                    <span>{option.label}</span>
                    {value === option.value && <Check className="w-4 h-4 text-leather-500" />}
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-sm text-center text-chrome-600 italic">
                  Nenhum resultado encontrado.
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
