import { Link, useLocation, Form, useSubmit, useMatches } from "react-router";
import {
  LayoutDashboard,
  Box,
  Users,
  Settings,
  LogOut,
  Layers,
  Activity
} from "lucide-react";
import React from "react";

export function OrbitLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const matches = useMatches();

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
    { icon: Box, label: 'Products', href: '/admin/products' },
    { icon: Users, label: 'Tenants', href: '/admin/tenants' },
    { icon: Activity, label: 'Analytics', href: '/admin/analytics' },
  ];

  return (
    <div className="flex h-screen bg-void text-text-primary font-sans antialiased overflow-hidden selection:bg-quantum selection:text-white">
      {/* Sidebar - Compact & Dense */}
      <aside className="w-56 border-r border-panel bg-orbital flex flex-col shrink-0">
        <div className="h-12 border-b border-panel flex items-center px-4">
          <div className="flex items-center gap-2 text-quantum font-mono font-bold tracking-tighter">
            <Layers className="w-5 h-5" />
            <span className="text-white text-sm">ORBIT<span className="text-text-dim">.SYS</span></span>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto no-scrollbar">
          <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-text-dim font-bold mt-2 mb-1">Modules</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-btn text-sm transition-all
                  ${isActive
                    ? 'bg-quantum/10 text-quantum border border-quantum/20 font-medium'
                    : 'text-text-secondary hover:text-white hover:bg-panel border border-transparent'}
                `}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-panel space-y-0.5">
          <button className="flex w-full items-center gap-3 px-3 py-2 rounded-btn text-text-secondary hover:text-white hover:bg-panel transition-all text-sm">
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <Form
            action="/logout"
            method="post"
            className="w-full"
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2 rounded-btn text-error/80 hover:text-error hover:bg-error/10 transition-all text-sm cursor-pointer"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </Form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Compact Header */}
        <header className="h-12 border-b border-panel bg-orbital/50 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            {(() => {
              // Hybrid Strategy: Matches -> Handle OR NavItem -> Crumb
              const crumbs = matches.flatMap((match) => {
                const handle = match.handle as { breadcrumb: (data: any) => { label: string; href?: string }[] } | undefined;

                // 1. Priority: Explicit Handle
                if (handle?.breadcrumb) {
                  return handle.breadcrumb(match.data);
                }

                // 2. Fallback: Auto-detect from Sidebar NavItems
                const navItem = navItems.find((item) => item.href === match.pathname);
                if (navItem) {
                  return [{ label: navItem.label, href: navItem.href }];
                }

                return [];
              });

              // Safety Fallback (if absolutely nothing matched, e.g. 404 or unmapped root)
              if (crumbs.length === 0) {
                return (
                  <span className="text-text-primary font-medium">Dashboard</span>
                )
              }

              // Render crumbs
              return crumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <span className="text-text-dim">/</span>
                  {crumb.href ? (
                    <Link to={crumb.href} className="text-text-secondary hover:text-white transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-text-primary font-medium">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ));
            })()}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-xs font-mono text-text-dim">SYSTEM_ONLINE</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6 bg-void relative">
          {/* Grid Pattern Background */}
          <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
          <div className="relative z-10 max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
