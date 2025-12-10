import { Outlet } from 'react-router';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Drawer } from '@/shared/ui/Drawer';

export function AppLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-shop-900 text-chrome-200 font-sans selection:bg-leather-700 selection:text-white bg-noise">
      <header className="p-4 border-b border-leather-800/30 flex justify-between items-center bg-shop-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="font-serif font-bold text-xl tracking-wider text-chrome-100 uppercase">
          Barber<span className="text-leather-700">Flow</span>
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="text-chrome-100 hover:text-leather-700 transition-colors p-2"
          aria-label="Abrir Menu"
        >
          <Menu size={28} />
        </button>
      </header>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main>
        <Outlet />
      </main>
    </div>
  );
}
