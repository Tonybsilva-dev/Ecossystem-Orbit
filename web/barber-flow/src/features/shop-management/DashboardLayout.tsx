import { useEffect } from 'react';
import { signOut, useSession } from '@/features/auth/client';
import { cn } from '@/shared/utils/cn';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  ShoppingBag,
  Settings,
  LogOut,
  ShieldAlert,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useLocation, useNavigate, Link, Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { useLicenseStatusStore, type BannerType } from './licenseStatus.store';

const LICENSE_REVALIDATE_INTERVAL_MS = 5 * 60 * 1000; // alinhado ao Cache-Control (max-age=600) do /validate

const BANNER_STYLES: Record<BannerType, { icon: typeof Info; className: string }> = {
  INFO: { icon: Info, className: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  WARNING: { icon: AlertTriangle, className: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  ERROR: { icon: XCircle, className: 'bg-red-500/10 border-red-500/20 text-red-400' },
  SUCCESS: { icon: CheckCircle2, className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  UPDATE: { icon: Sparkles, className: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
};

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { licenseStatus, licenseBlockReason, banners, lastCheckedAt, hasModule, refresh } =
    useLicenseStatusStore();

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, LICENSE_REVALIDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // @ts-expect-error - extended session type
  const sessionLicenseStatus = session?.user?.barbershop?.licenseStatus;
  const effectiveStatus = lastCheckedAt ? licenseStatus : sessionLicenseStatus;
  const isLicenseInactive = effectiveStatus && effectiveStatus !== 'ACTIVE';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const allNavItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', href: '/dashboard', module: null },
    { icon: CalendarDays, label: 'Agendamentos', href: '/dashboard/appointments', module: 'appointments' },
    { icon: Users, label: 'Barbeiros', href: '/dashboard/barbers', module: 'barbers' },
    { icon: Scissors, label: 'Serviços', href: '/dashboard/services', module: 'services' },
    { icon: ShoppingBag, label: 'Produtos', href: '/dashboard/products', module: 'products' },
  ];

  // Antes do primeiro refresh não sabemos os módulos ao vivo — mostra tudo
  // pra não esconder navegação por um falso negativo enquanto carrega.
  const navItems = lastCheckedAt
    ? allNavItems.filter((item) => !item.module || hasModule(item.module))
    : allNavItems;

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
      <main className="flex-1 overflow-auto flex flex-col">
        {/* License gate banner */}
        {isLicenseInactive && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-8 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-500">
              <ShieldAlert size={18} />
              <span className="text-sm font-bold">
                {licenseBlockReason || 'Licença Inativa ou Expirada'}
              </span>
            </div>
            <button
              onClick={() => navigate('/dashboard/subscription')}
              className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
            >
              Regularizar Agora
            </button>
          </div>
        )}

        {/* Broadcast banners vindos do Orbit — cada produto estiliza com a própria
            identidade, mas o dado (tipo/mensagem/link) vem padronizado do control plane. */}
        {banners.map((banner) => {
          const style = BANNER_STYLES[banner.type];
          const Icon = style.icon;
          return (
            <div
              key={banner.id}
              className={cn('border-b px-8 py-2 flex items-center justify-between', style.className)}
            >
              <div className="flex items-center gap-2">
                <Icon size={18} />
                <span className="text-sm font-medium">{banner.message}</span>
              </div>
              {banner.link && (
                <a
                  href={banner.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline hover:no-underline shrink-0 ml-4"
                >
                  Saiba mais
                </a>
              )}
            </div>
          );
        })}

        <header className="h-16 min-h-[4rem] border-b border-leather-800/30 bg-shop-900/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-8">
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

        <div className="p-8 flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}
