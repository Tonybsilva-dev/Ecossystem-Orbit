import { Link } from "react-router";
import { Box, Users, ArrowUpRight } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="p-0 font-sans max-w-6xl mx-auto space-y-6">
      {/* Hero Section */}
      <div className="flex items-end justify-between border-b border-panel pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-quantum animate-pulse"></span>
            <span className="text-xs font-mono text-quantum uppercase tracking-widest">Control Plane Overview</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            System Dashboard
          </h1>
          <p className="text-text-secondary mt-1">
            Global metrics and resource management.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products Card */}
        <Link
          to="products"
          className="group relative block p-6 bg-orbital border border-panel rounded-card transition-all duration-300 hover:border-quantum/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.1)]"
        >
          <div className="absolute top-4 right-4 text-text-dim group-hover:text-quantum transition-colors">
            <ArrowUpRight size={20} />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-panel rounded-lg flex items-center justify-center shrink-0 border border-white/5 group-hover:border-quantum/20 transition-colors">
              <Box className="w-6 h-6 text-text-primary group-hover:text-quantum transition-colors" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-text-primary mb-1">Products & Plans</h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                Manage SaaS catalog, pricing models, and feature sets.
              </p>

              <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-panel/50 border border-panel text-xs font-mono text-text-dim">
                <span>STATUS:</span>
                <span className="text-success">ACTIVE</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Tenants Card */}
        <Link
          to="tenants"
          className="group relative block p-6 bg-orbital border border-panel rounded-card transition-all duration-300 hover:border-quantum/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.1)]"
        >
          <div className="absolute top-4 right-4 text-text-dim group-hover:text-quantum transition-colors">
            <ArrowUpRight size={20} />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-panel rounded-lg flex items-center justify-center shrink-0 border border-white/5 group-hover:border-quantum/20 transition-colors">
              <Users className="w-6 h-6 text-text-primary group-hover:text-quantum transition-colors" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-text-primary mb-1">Tenant Directory</h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                Monitor client instances, subscriptions, and access controls.
              </p>

              <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-panel/50 border border-panel text-xs font-mono text-text-dim">
                <span>SYNC:</span>
                <span className="text-success">REALTIME</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="bg-orbital border border-panel p-5 rounded-card flex flex-col">
          <span className="text-xs font-mono text-text-dim uppercase mb-1">Total MRR</span>
          <span className="text-2xl font-bold text-text-primary font-mono">$124,500</span>
        </div>
        <div className="bg-orbital border border-panel p-5 rounded-card flex flex-col">
          <span className="text-xs font-mono text-text-dim uppercase mb-1">Active Subscribers</span>
          <span className="text-2xl font-bold text-text-primary font-mono">1,894</span>
        </div>
        <div className="bg-orbital border border-panel p-5 rounded-card flex flex-col">
          <span className="text-xs font-mono text-text-dim uppercase mb-1">Avg. Churn</span>
          <span className="text-2xl font-bold text-text-primary font-mono">1.2%</span>
        </div>
      </div>
    </div>
  );
}
