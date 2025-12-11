import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Orbit | Centralize Your SaaS Universe" },
    { name: "description", content: "The gravitational center for your multi-tenant SaaS. Manage licenses, clients, and products in one place." },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-void font-sans overflow-x-hidden selection:bg-quantum selection:text-white">
      {/* Header / Nav */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-void/80 border-b border-panel transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-quantum flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-quantum to-indigo-600"></div>
              <div className="w-2 h-2 rounded-full bg-white relative z-10 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary font-mono">Orbit</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-quantum transition-colors">Features</a>
            <a href="#solutions" className="hover:text-quantum transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-quantum transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-btn bg-orbital border border-panel text-text-primary text-sm font-semibold hover:border-quantum/50 hover:shadow-[0_0_12px_rgba(124,58,237,0.25)] transition-all duration-300"
            >
              Control Plane
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.2)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)] pointer-events-none"></div>

        {/* Decorative Orbits */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-panel/30 rounded-full animate-[spin_60s_linear_infinite] opacity-30 -z-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-quantum/20 rounded-full animate-[spin_40s_linear_infinite_reverse] opacity-40 -z-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-data-blue/20 rounded-full animate-[spin_20s_linear_infinite] opacity-30 -z-10"></div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orbital border border-quantum/30 text-xs font-mono text-quantum-hover mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
            SYSTEM STATUS: OPERATIONAL
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-quantum to-data-blue">Gravitational Center</span><br />
            of Your SaaS Universe
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-text-secondary mb-12 leading-relaxed">
            Centralize licensing, tenant management, and product distribution.
            Orbit provides the core infrastructure to launch usage-based software at scale.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-card bg-quantum text-white font-semibold text-lg shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:bg-quantum-hover hover:translate-y-[-2px] transition-all duration-300"
            >
              Initialize System
            </Link>
            <a
              href="#docs"
              className="w-full sm:w-auto px-8 py-4 rounded-card bg-orbital border border-panel text-text-primary font-semibold text-lg hover:border-text-secondary transition-all duration-300"
            >
              Read Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-orbital/30 relative border-t border-panel">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Core Modules</h2>
            <p className="text-text-secondary">Powerful primitives for modern software distribution</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 - Large */}
            <div className="md:col-span-2 p-8 rounded-dock bg-orbital border border-panel hover:border-quantum/30 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.75l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
              </div>
              <div className="h-12 w-12 bg-panel rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-data-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Multi-Tenant Isolation</h3>
              <p className="text-text-secondary">Built-in tenant separation ensures data privacy and security for all your clients. Deploy once, serve thousands.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-dock bg-orbital border border-panel hover:border-quantum/30 transition-all duration-300 group">
              <div className="h-12 w-12 bg-panel rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Licensing Engine</h3>
              <p className="text-text-secondary">Flexible license key generation and validation for strict access control.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-dock bg-orbital border border-panel hover:border-quantum/30 transition-all duration-300 group">
              <div className="h-12 w-12 bg-panel rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-quantum" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Usage Analytics</h3>
              <p className="text-text-secondary">Track feature adoption and module usage in real-time.</p>
            </div>

            {/* Feature 4 - Large */}
            <div className="md:col-span-2 p-8 rounded-dock bg-orbital border border-panel hover:border-quantum/30 transition-all duration-300 group">
              <div className="h-12 w-12 bg-panel rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">High Performance Core</h3>
              <p className="text-text-secondary">Powered by Remix/React Router 7 and Prisma for blazing fast edge-ready performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-orbital border-t border-panel text-text-secondary py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-quantum flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
              <span className="text-lg font-bold text-white font-mono">Orbit</span>
            </div>
            <p className="text-xs max-w-xs leading-relaxed">
              Designing the future of SaaS infrastructure. <br />
              Built with precision for developers.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-xs uppercase tracking-wider text-text-dim font-mono">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-xs uppercase tracking-wider text-text-dim font-mono">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-panel text-center md:text-left text-xs text-text-dim font-mono">
          © {new Date().getFullYear()} Orbit Systems. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
