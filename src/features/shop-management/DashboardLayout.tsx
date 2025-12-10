import { Outlet, Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  ShoppingBag,
  LogOut,
  Settings,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { signOut } from '@/features/auth/client';
import { useNavigate } from 'react-router';

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', href: '/dashboard' },
    { icon: CalendarDays, label: 'Agendamentos', href: '/dashboard/appointments' },
    { icon: Users, label: 'Barbeiros', href: '/dashboard/barbers' },
    { icon: Scissors, label: 'Serviços', href: '/dashboard/services' },
    { icon: ShoppingBag, label: 'Produtos', href: '/dashboard/products' },
  ];

  return (
    <div className="flex h-screen bg-shop-900 text-chrome-200 font-sans bg-noise">
      {/* Sidebar */}
      <aside className="w-64 border-r border-leather-800/30 bg-shop-900/95 flex flex-col">
        <div className="p-6 border-b border-leather-800/30">
          <div className="font-serif font-bold text-xl tracking-wider text-chrome-100 uppercase">
            Barber<span className="text-leather-700">Flow</span>
            <span className="text-xs block text-chrome-400 font-sans tracking-normal mt-1">
              Backoffice
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-sm transition-all',
                  isActive
                    ? 'bg-leather-700 text-white shadow-md font-medium'
                    : 'text-chrome-400 hover:text-white hover:bg-shop-800',
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-leather-800/30 space-y-2">
          <button className="flex w-full items-center gap-3 px-4 py-3 rounded-sm text-chrome-400 hover:text-white hover:bg-shop-800 transition-all">
            <Settings size={20} />
            <span>Configurações</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-sm text-red-400 hover:text-red-200 hover:bg-red-900/20 transition-all"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-leather-800/30 bg-shop-900/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-8">
          <h2 className="font-serif text-lg text-chrome-100">
            {navItems.find((i) => i.href === location.pathname)?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-chrome-400">Admin</span>
            <div className="w-8 h-8 rounded-full bg-leather-700 flex items-center justify-center text-white font-bold">
              A
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
