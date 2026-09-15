import { Link } from "react-router";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Box, Users, ArrowUpRight, DollarSign, TrendingDown, Layers, AlertTriangle, Megaphone, Clock } from "lucide-react";
import { orbitApi } from "../core/orbit-api/orbit-api.server";

interface ProductAnalytics {
  activeSubscribers: number;
  churnedSubscribers: number;
  churnRate: number;
  mrr: string;
}

interface ProductListItem {
  id: string;
  name: string;
  plans: { id: string }[];
  [key: string]: unknown;
}

interface TenantOwner {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface TenantSubscription {
  id: string;
  status: string;
  plan: { id: string; name: string; product: { id: string; name: string } };
}

interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  users: TenantOwner[];
  subscriptions: TenantSubscription[];
}

interface BannerItem {
  id: string;
  isActive: boolean;
}

function healthIssue(tenant: TenantListItem): string | null {
  if (tenant.users.length === 0) return "No linked user";
  if (!tenant.subscriptions.some((s) => s.status === "ACTIVE")) return "No active subscription";
  return null;
}

const STATUS_META: Record<string, string> = {
  ACTIVE: "text-success",
  PAST_DUE: "text-warning",
  INACTIVE: "text-error",
};

export const loader = async (_args: LoaderFunctionArgs) => {
  const [products, tenants, banners] = await Promise.all([
    orbitApi.get<ProductListItem[]>("/products"),
    orbitApi.get<TenantListItem[]>("/tenants"),
    orbitApi.get<BannerItem[]>("/banners"),
  ]);

  const productsWithAnalytics = await Promise.all(
    products.map(async (p) => {
      const analytics = await orbitApi.get<ProductAnalytics>(`/products/${p.id}/analytics`);
      return { ...p, analytics };
    })
  );

  const totals = productsWithAnalytics.reduce(
    (acc, p) => {
      acc.mrr += Number(p.analytics.mrr);
      acc.activeSubscribers += p.analytics.activeSubscribers;
      acc.churned += p.analytics.churnedSubscribers;
      return acc;
    },
    { mrr: 0, activeSubscribers: 0, churned: 0 }
  );
  const avgChurn = totals.activeSubscribers + totals.churned > 0
    ? (totals.churned / (totals.activeSubscribers + totals.churned)) * 100
    : 0;

  const totalPlans = products.reduce((n, p) => n + p.plans.length, 0);
  const flaggedTenants = tenants.filter((t) => healthIssue(t) !== null).length;
  const activeBanners = banners.filter((b) => b.isActive).length;

  return {
    products: productsWithAnalytics,
    totalPlans,
    totalTenants: tenants.length,
    flaggedTenants,
    recentTenants: tenants.slice(0, 5),
    activeBanners,
    totalMrr: totals.mrr,
    totalActiveSubscribers: totals.activeSubscribers,
    avgChurn,
  };
};

export default function AdminDashboard() {
  const {
    products,
    totalPlans,
    totalTenants,
    flaggedTenants,
    recentTenants,
    activeBanners,
    totalMrr,
    totalActiveSubscribers,
    avgChurn,
  } = useLoaderData<typeof loader>();

  return (
    <div className="p-0 font-sans max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="flex items-end justify-between border-b border-panel pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-quantum animate-pulse"></span>
            <span className="text-xs text-quantum">Control Plane Overview</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            System Dashboard
          </h1>
          <p className="text-text-secondary mt-1">
            Global metrics and resource management.
          </p>
        </div>
      </div>

      {/* Nav Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="products"
          className="group relative block p-6 bg-orbital border border-panel rounded-card transition-all duration-300 hover:border-quantum/50 hover:shadow-[0_0_20px_rgba(238,240,242,0.08)]"
        >
          <div className="absolute top-4 right-4 text-text-dim group-hover:text-quantum transition-colors">
            <ArrowUpRight size={20} />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-panel rounded-none flex items-center justify-center shrink-0 border border-white/5 group-hover:border-quantum/20 transition-colors">
              <Box className="w-6 h-6 text-text-primary group-hover:text-quantum transition-colors" />
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary mb-1">Products & Plans</h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                Manage SaaS catalog, pricing models, and feature sets.
              </p>

              <div className="flex items-center gap-6 pt-3 border-t border-panel">
                <div>
                  <div className="text-lg font-bold text-text-primary">{products.length}</div>
                  <div className="text-[11px] text-text-dim">Products</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-text-primary">{totalPlans}</div>
                  <div className="text-[11px] text-text-dim">Plans</div>
                </div>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="tenants"
          className="group relative block p-6 bg-orbital border border-panel rounded-card transition-all duration-300 hover:border-quantum/50 hover:shadow-[0_0_20px_rgba(238,240,242,0.08)]"
        >
          <div className="absolute top-4 right-4 text-text-dim group-hover:text-quantum transition-colors">
            <ArrowUpRight size={20} />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-panel rounded-none flex items-center justify-center shrink-0 border border-white/5 group-hover:border-quantum/20 transition-colors">
              <Users className="w-6 h-6 text-text-primary group-hover:text-quantum transition-colors" />
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary mb-1">Tenant Directory</h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                Monitor client instances, subscriptions, and access controls.
              </p>

              <div className="flex items-center gap-6 pt-3 border-t border-panel">
                <div>
                  <div className="text-lg font-bold text-text-primary">{totalTenants}</div>
                  <div className="text-[11px] text-text-dim">Tenants</div>
                </div>
                {flaggedTenants > 0 && (
                  <div>
                    <div className="text-lg font-bold text-warning">{flaggedTenants}</div>
                    <div className="text-[11px] text-text-dim">Need attention</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-orbital border border-panel p-5 rounded-card flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-text-dim">
            <DollarSign size={12} />
            <span className="text-xs">Total MRR</span>
          </div>
          <span className="text-2xl font-bold text-text-primary">${Math.round(totalMrr).toLocaleString("en-US")}</span>
        </div>
        <div className="bg-orbital border border-panel p-5 rounded-card flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-text-dim">
            <Users size={12} />
            <span className="text-xs">Active Subscriptions</span>
          </div>
          <span className="text-2xl font-bold text-text-primary">{totalActiveSubscribers.toLocaleString("en-US")}</span>
        </div>
        <div className="bg-orbital border border-panel p-5 rounded-card flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-text-dim">
            <Layers size={12} />
            <span className="text-xs">Tenants</span>
          </div>
          <span className="text-2xl font-bold text-text-primary">{totalTenants.toLocaleString("en-US")}</span>
        </div>
        <div className="bg-orbital border border-panel p-5 rounded-card flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-text-dim">
            <TrendingDown size={12} />
            <span className="text-xs">Avg. Churn</span>
          </div>
          <span className="text-2xl font-bold text-text-primary">{avgChurn.toFixed(1)}%</span>
        </div>
      </div>

      {/* Per-Product Breakdown */}
      <div className="bg-orbital border border-panel rounded-card overflow-hidden">
        <div className="px-6 py-4 border-b border-panel">
          <h3 className="text-sm font-bold text-text-primary">Products Breakdown</h3>
        </div>
        {products.length === 0 ? (
          <div className="p-6 text-sm text-text-dim">No products registered yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-dim text-xs border-b border-panel">
                <th className="px-6 py-2.5 font-medium">Product</th>
                <th className="px-6 py-2.5 font-medium">Active Subs</th>
                <th className="px-6 py-2.5 font-medium">MRR</th>
                <th className="px-6 py-2.5 font-medium">Churn</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-panel last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3">
                    <Link to={`products/${p.id}`} className="font-semibold text-text-primary hover:text-quantum transition-colors">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-text-secondary">{p.analytics.activeSubscribers}</td>
                  <td className="px-6 py-3 text-text-secondary">${Math.round(Number(p.analytics.mrr)).toLocaleString("en-US")}</td>
                  <td className="px-6 py-3 text-text-secondary">{p.analytics.churnRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-orbital border border-panel rounded-card overflow-hidden">
          <div className="px-6 py-4 border-b border-panel flex items-center gap-2">
            <Clock size={14} className="text-text-dim" />
            <h3 className="text-sm font-bold text-text-primary">Recent Tenants</h3>
          </div>
          {recentTenants.length === 0 ? (
            <div className="p-6 text-sm text-text-dim">No tenants yet.</div>
          ) : (
            <ul>
              {recentTenants.map((t) => {
                const issue = healthIssue(t);
                return (
                  <li key={t.id}>
                    <Link
                      to={`tenants?tenantId=${t.id}`}
                      className="flex items-center justify-between px-6 py-3 border-b border-panel last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <div>
                        <div className="text-sm font-semibold text-text-primary">{t.name}</div>
                        <div className="text-xs text-text-dim mt-0.5">
                          {t.users[0]?.email ?? "No linked user"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-bold ${STATUS_META[t.status] ?? "text-text-secondary"}`}>
                          {t.status.charAt(0) + t.status.slice(1).toLowerCase().replace("_", " ")}
                        </div>
                        {issue && (
                          <div className="text-[11px] text-warning mt-0.5">{issue}</div>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-orbital border border-panel rounded-card p-6 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 text-text-dim mb-2">
              <Megaphone size={14} />
              <span className="text-xs font-medium">Active Banners</span>
            </div>
            <Link to="banners" className="text-2xl font-bold text-text-primary hover:text-quantum transition-colors">
              {activeBanners}
            </Link>
          </div>
          <div className="pt-4 border-t border-panel">
            <div className="flex items-center gap-2 text-text-dim mb-2">
              <AlertTriangle size={14} />
              <span className="text-xs font-medium">Tenants Needing Attention</span>
            </div>
            <Link to="tenants" className={`text-2xl font-bold transition-colors ${flaggedTenants > 0 ? "text-warning hover:text-warning" : "text-text-primary hover:text-quantum"}`}>
              {flaggedTenants}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
