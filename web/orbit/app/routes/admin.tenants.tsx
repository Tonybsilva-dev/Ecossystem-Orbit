import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";
import { useLoaderData, useSearchParams, Form, useNavigation } from "react-router";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { orbitApi } from "../core/orbit-api/orbit-api.server";
import {
  Plus, ShieldCheck, CreditCard, Search, AlertTriangle, FileDown, X, Power,
  Users, Pencil, Ban, Trash2, Calendar,
} from "lucide-react";
import { clsx } from "clsx";

// ---- Types ----

interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  users: { id: string; email: string }[];
  subscriptions: { id: string; status: string; plan: { id: string; name: string; price: string; product: { id: string; name: string } } }[];
}

interface SubscriptionListItem {
  id: string;
  status: string;
  licenseKey: string;
  createdAt: string;
  tenant: { id: string; name: string; slug: string };
  plan: { name: string; product: { name: string } };
}

interface ProductWithPlans {
  id: string;
  name: string;
  plans: { id: string; name: string; price: string }[];
}

interface TenantUser { id: string; email: string; name: string | null; role: string }
interface TenantSubscription {
  id: string; status: string; licenseKey: string; expiresAt: string | null; canceledAt: string | null; createdAt: string;
  plan: { id: string; name: string; price: string; interval: string; product: { id: string; name: string } };
}
interface TenantDetail {
  id: string; name: string; slug: string; status: string; createdAt: string;
  users: TenantUser[]; subscriptions: TenantSubscription[];
}

type ViewMode = "tenants" | "subscriptions";

// ---- Loader ----

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const view = (url.searchParams.get("view") === "subscriptions" ? "subscriptions" : "tenants") as ViewMode;
  const productId = url.searchParams.get("productId") || "";
  const planId = url.searchParams.get("planId") || "";
  const status = url.searchParams.get("status") || "";
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page")) || 1;
  const tenantId = url.searchParams.get("tenantId");

  const products = await orbitApi.get<ProductWithPlans[]>("/products");

  let tenants: TenantListItem[] = [];
  let subscriptionsResult: { subscriptions: SubscriptionListItem[]; pagination: { total: number; page: number; limit: number; totalPages: number } } | null = null;

  if (view === "tenants") {
    const query = new URLSearchParams();
    if (productId) query.set("productId", productId);
    if (planId) query.set("planId", planId);
    if (search) query.set("search", search);
    tenants = await orbitApi.get<TenantListItem[]>(`/tenants${query.toString() ? `?${query}` : ""}`);
  } else {
    const query = new URLSearchParams({ page: String(page), limit: "10" });
    if (productId) query.set("productId", productId);
    if (status) query.set("status", status);
    if (search) query.set("search", search);
    subscriptionsResult = await orbitApi.get(`/subscriptions?${query}`);
  }

  const selectedTenant = tenantId
    ? await orbitApi.get<TenantDetail>(`/tenants/${tenantId}`).catch(() => null)
    : null;

  return {
    view,
    tenants,
    subscriptionsResult,
    products,
    selectedTenant,
    filters: { productId, planId, status, search, page },
  };
};

export const handle = {
  breadcrumb: () => [{ label: "Tenants" }],
};

// ---- Action (tudo que a drawer de detalhe do tenant pode disparar) ----

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const tenantId = formData.get("tenantId") as string;

  const backTo = (extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (tenantId) params.set("tenantId", tenantId);
    for (const [k, v] of Object.entries(extra ?? {})) params.set(k, v);
    return redirect(`/admin/tenants${params.toString() ? `?${params}` : ""}`);
  };

  if (intent === "set_status") {
    const status = formData.get("status") as string;
    await orbitApi.post(`/tenants/${tenantId}/status`, { status });
    return backTo();
  }

  if (intent === "add_subscription") {
    const planId = formData.get("planId") as string;
    if (!planId) return null;
    await orbitApi.post(`/tenants/${tenantId}/subscriptions`, { planId });
    return backTo();
  }

  if (intent === "cancel_subscription") {
    const subscriptionId = formData.get("subscriptionId") as string;
    await orbitApi.post(`/subscriptions/${subscriptionId}/cancel`);
    return backTo();
  }

  if (intent === "delete_subscription") {
    const subscriptionId = formData.get("subscriptionId") as string;
    await orbitApi.delete(`/subscriptions/${subscriptionId}`);
    return backTo();
  }

  if (intent === "update_tenant") {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    await orbitApi.patch(`/tenants/${tenantId}`, { name, slug });
    return backTo();
  }

  return null;
};

// ---- Helpers ----

function healthIssue(tenant: TenantListItem): string | null {
  if (tenant.users.length === 0) return "SEM_USUÁRIO_VINCULADO";
  if (!tenant.subscriptions.some((s) => s.status === "ACTIVE")) return "SEM_ASSINATURA_ATIVA";
  return null;
}

const HEALTH_ISSUE_LABELS: Record<string, string> = {
  SEM_USUÁRIO_VINCULADO: "Sem usuário vinculado",
  SEM_ASSINATURA_ATIVA: "Sem assinatura ativa",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  CANCELED: "Canceled",
  TRIAL: "Trial",
  PAST_DUE: "Past Due",
  EXPIRED: "Expired",
  INACTIVE: "Inactive",
};

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ACTIVE" ? "bg-success/10 text-success border-success/20" :
    status === "CANCELED" ? "bg-red-500/10 text-red-500 border-red-500/20" :
    status === "TRIAL" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
    status === "PAST_DUE" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
    "bg-text-dim/10 text-text-dim border-text-dim/20";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "ACTIVE" ? "bg-success animate-pulse" : "bg-current"}`}></span>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ---- Component ----

export default function AdminTenants() {
  const { view, tenants, subscriptionsResult, products, selectedTenant, filters } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [mounted, setMounted] = useState(false);
  const [editingTenant, setEditingTenant] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "CANCEL" | "DELETE"; subscriptionId: string } | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => setEditingTenant(false), [selectedTenant?.id]);

  const selectedProduct = products.find((p) => p.id === filters.productId);

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      if (key === "productId") prev.delete("planId");
      if (key !== "page") prev.delete("page");
      return prev;
    });
  };

  const setView = (v: ViewMode) => {
    setSearchParams((prev) => {
      prev.set("view", v);
      prev.delete("planId");
      prev.delete("status");
      prev.delete("page");
      return prev;
    });
  };

  const openTenant = (id: string) => {
    setSearchParams((prev) => {
      prev.set("tenantId", id);
      return prev;
    });
  };

  const closeDrawer = () => {
    setSearchParams((prev) => {
      prev.delete("tenantId");
      return prev;
    });
  };

  // Debounced search -> URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm !== filters.search) updateParam("search", searchTerm);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const exportQuery = new URLSearchParams();
  if (filters.productId) exportQuery.set("productId", filters.productId);
  if (view === "tenants" && filters.planId) exportQuery.set("planId", filters.planId);
  if (view === "subscriptions" && filters.status) exportQuery.set("status", filters.status);
  if (filters.search) exportQuery.set("search", filters.search);
  const exportUrl = `/admin/${view === "tenants" ? "tenants" : "subscriptions"}/export${exportQuery.toString() ? `?${exportQuery}` : ""}`;

  const activeSub = selectedTenant?.subscriptions.find((s) => s.status === "ACTIVE");
  const distinctProducts = selectedTenant
    ? Array.from(new Map(selectedTenant.subscriptions.map((s) => [s.plan.product.id, s.plan.product.name])).values())
    : [];

  return (
    <div className="p-0 font-sans max-w-7xl mx-auto space-y-6 relative">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">
          Tenant Directory
        </h1>
        <p className="text-text-secondary max-w-xl">
          Clientes, assinaturas e módulos ativos — uma pessoa (mesmo email) pode acumular assinaturas em vários produtos, sempre sob o mesmo tenant.
        </p>
      </div>

      {/* Filter bar — colada no título, view toggle + filtros + export juntos */}
      <div className="flex flex-col gap-3 border-b border-panel pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="bg-orbital border border-panel p-1 rounded-btn flex items-center w-fit">
            <button
              onClick={() => setView("tenants")}
              className={clsx("px-4 py-1.5 text-xs font-bold rounded transition-all", view === "tenants" ? "bg-quantum text-void shadow-sm" : "text-text-dim hover:text-text-secondary")}
            >
              Tenants
            </button>
            <button
              onClick={() => setView("subscriptions")}
              className={clsx("px-4 py-1.5 text-xs font-bold rounded transition-all", view === "subscriptions" ? "bg-quantum text-void shadow-sm" : "text-text-dim hover:text-text-secondary")}
            >
              Subscriptions
            </button>
          </div>

          <a
            href={exportUrl}
            title="Gerado no backend — respeita os filtros aplicados"
            className="flex items-center gap-2 bg-panel hover:bg-panel/80 text-text-secondary hover:text-white px-4 py-2 rounded-btn text-xs font-bold transition-all"
          >
            <FileDown className="w-4 h-4" />
            Export {view === "tenants" ? "Tenants" : "Subscriptions"} (PDF)
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] text-text-dim mb-1">Produto</label>
            <select
              value={filters.productId}
              onChange={(e) => updateParam("productId", e.target.value)}
              className="bg-orbital border border-panel rounded-btn py-2 px-3 text-xs text-text-primary focus:outline-none focus:border-quantum focus:ring-1 focus:ring-quantum appearance-none"
            >
              <option value="">All Products</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {view === "tenants" ? (
            <div>
              <label className="block text-[10px] text-text-dim mb-1">Plano</label>
              <select
                value={filters.planId}
                onChange={(e) => updateParam("planId", e.target.value)}
                disabled={!selectedProduct}
                className="bg-orbital border border-panel rounded-btn py-2 px-3 text-xs text-text-primary focus:outline-none focus:border-quantum focus:ring-1 focus:ring-quantum appearance-none disabled:opacity-40"
              >
                <option value="">All Plans</option>
                {selectedProduct?.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] text-text-dim mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => updateParam("status", e.target.value)}
                className="bg-orbital border border-panel rounded-btn py-2 px-3 text-xs text-text-primary focus:outline-none focus:border-quantum focus:ring-1 focus:ring-quantum appearance-none"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="CANCELED">Canceled</option>
                <option value="EXPIRED">Expired</option>
                <option value="TRIAL">Trial</option>
                <option value="PAST_DUE">Past Due</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] text-text-dim mb-1">Busca</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim w-4 h-4" />
              <input
                type="text"
                placeholder="Nome, slug ou license key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-orbital border border-panel rounded-btn py-2 pl-9 pr-4 text-xs text-text-primary focus:outline-none focus:border-quantum focus:ring-1 focus:ring-quantum w-56"
              />
            </div>
          </div>

          <button
            title="Criação manual de tenant ainda não implementada nesta tela"
            disabled
            className="self-end flex items-center gap-2 bg-panel text-text-dim px-4 py-2 rounded-btn text-xs font-semibold cursor-not-allowed opacity-50"
          >
            <Plus size={14} />
            New Tenant
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-orbital border border-panel rounded-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          {view === "tenants" ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-panel bg-void/50">
                  <th className="p-4 pl-6 text-xs font-bold text-text-dim">Inst. Identifier</th>
                  <th className="p-4 text-xs font-bold text-text-dim">System Status</th>
                  <th className="p-4 text-xs font-bold text-text-dim">Produtos / Planos</th>
                  <th className="p-4 pr-6 text-xs font-bold text-text-dim text-right">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel">
                {tenants.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-text-dim text-xs">No tenants found</td></tr>
                )}
                {tenants.map((tenant) => {
                  const issue = healthIssue(tenant);
                  return (
                    <tr key={tenant.id} onClick={() => openTenant(tenant.id)} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-panel flex items-center justify-center shrink-0 border border-white/5">
                            <ShieldCheck className="w-4 h-4 text-text-dim group-hover:text-quantum transition-colors" />
                          </div>
                          <div>
                            <div className="font-bold text-text-primary text-sm">{tenant.name}</div>
                            <div className="text-xs text-text-dim font-mono mt-0.5">{tenant.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border ${tenant.status === "ACTIVE" ? "bg-success/10 text-success border-success/20" : "bg-text-dim/10 text-text-dim border-text-dim/20"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === "ACTIVE" ? "bg-success animate-pulse" : "bg-text-dim"}`}></span>
                          {STATUS_LABELS[tenant.status] ?? tenant.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {tenant.subscriptions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {tenant.subscriptions.map((sub) => (
                              <div key={sub.id} className="flex items-center gap-2 bg-void border border-panel px-2.5 py-1.5 rounded text-xs">
                                <CreditCard className="w-3 h-3 text-quantum" />
                                <span className="text-text-secondary font-medium">{sub.plan.product.name}</span>
                                <span className="text-text-dim">/</span>
                                <span className="text-text-primary">{sub.plan.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-text-dim italic text-xs">No active plans</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {issue ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border bg-warning/10 text-warning border-warning/20">
                            <AlertTriangle className="w-3 h-3" />
                            {HEALTH_ISSUE_LABELS[issue] ?? issue}
                          </span>
                        ) : (
                          <span className="text-text-dim text-[10px]">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-panel bg-void/50">
                  <th className="p-4 pl-6 text-xs font-bold text-text-dim">Status</th>
                  <th className="p-4 text-xs font-bold text-text-dim">Tenant</th>
                  <th className="p-4 text-xs font-bold text-text-dim">Plan / Product</th>
                  <th className="p-4 text-xs font-bold text-text-dim">License Key</th>
                  <th className="p-4 pr-6 text-xs font-bold text-text-dim">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel">
                {subscriptionsResult?.subscriptions.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-text-dim text-xs">No subscriptions found</td></tr>
                )}
                {subscriptionsResult?.subscriptions.map((sub) => (
                  <tr key={sub.id} onClick={() => openTenant(sub.tenant.id)} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                    <td className="p-4 pl-6"><StatusBadge status={sub.status} /></td>
                    <td className="p-4">
                      <div className="font-bold text-text-primary text-sm">{sub.tenant.name}</div>
                      <div className="text-xs text-text-dim font-mono mt-0.5">{sub.tenant.slug}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-quantum" />
                        <span className="text-text-secondary font-medium text-sm">{sub.plan.product.name}</span>
                        <span className="text-text-dim">/</span>
                        <span className="text-text-primary text-sm">{sub.plan.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-xs font-mono bg-void px-2 py-1 rounded border border-panel text-text-secondary">{sub.licenseKey}</code>
                    </td>
                    <td className="p-4 pr-6 text-xs text-text-dim font-mono">{new Date(sub.createdAt).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {view === "subscriptions" && subscriptionsResult && (
          <div className="border-t border-panel p-4 flex justify-between items-center bg-void/30">
            <div className="text-xs text-text-dim">
              Page {subscriptionsResult.pagination.page} of {subscriptionsResult.pagination.totalPages || 1}
            </div>
            <div className="flex gap-2">
              <button
                disabled={subscriptionsResult.pagination.page <= 1}
                onClick={() => setSearchParams((prev) => { prev.set("page", String(subscriptionsResult.pagination.page - 1)); return prev; })}
                className="px-3 py-1.5 rounded border border-panel text-text-dim hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
              >
                Previous
              </button>
              <button
                disabled={subscriptionsResult.pagination.page >= subscriptionsResult.pagination.totalPages}
                onClick={() => setSearchParams((prev) => { prev.set("page", String(subscriptionsResult.pagination.page + 1)); return prev; })}
                className="px-3 py-1.5 rounded border border-panel text-text-dim hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---- Tenant detail drawer ---- */}
      {selectedTenant && mounted && createPortal(
        <div className="fixed inset-y-0 right-0 left-56 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={closeDrawer} />
          <div className="relative w-full max-w-lg bg-orbital border-l border-panel h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-panel flex justify-between items-start bg-void/30 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-text-primary tracking-tight">{selectedTenant.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-text-dim font-mono">{selectedTenant.slug}</span>
                  <StatusBadge status={selectedTenant.status} />
                </div>
                {distinctProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {distinctProducts.map((name) => (
                      <span key={name} className="text-[10px] font-bold text-quantum bg-quantum/10 px-2 py-0.5 rounded border border-quantum/20">
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setEditingTenant(true)} title="Edit tenant" className="text-text-dim hover:text-white transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={closeDrawer} className="text-text-dim hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(selectedTenant.users.length === 0 || !activeSub) && (
                <div className="bg-warning/10 border border-warning/20 rounded-card p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div className="text-[11px] text-warning space-y-0.5">
                    {selectedTenant.users.length === 0 && <div>Sem usuário vinculado</div>}
                    {!activeSub && <div>Sem assinatura ativa — kill switch aqui não bloqueia nada de verdade.</div>}
                  </div>
                </div>
              )}

              {/* Kill switch */}
              <div>
                <label className="text-xs font-bold text-error/80 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> Kill Switch
                </label>
                <Form method="post" className="flex items-center gap-2">
                  <input type="hidden" name="intent" value="set_status" />
                  <input type="hidden" name="tenantId" value={selectedTenant.id} />
                  <select name="status" defaultValue={selectedTenant.status} className="flex-1 text-xs bg-void border border-panel rounded-btn py-2 px-2 text-text-primary focus:ring-1 focus:ring-error focus:border-error appearance-none cursor-pointer">
                    <option value="ACTIVE">Active</option>
                    <option value="PAST_DUE">Past Due</option>
                    <option value="INACTIVE">Inactive (bloqueado)</option>
                  </select>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 bg-error/10 border border-error/30 text-error px-3 py-2 rounded-btn text-xs font-bold hover:bg-error/20 transition-all shrink-0">
                    <Power className="w-3.5 h-3.5" /> Aplicar
                  </button>
                </Form>
              </div>

              {/* Users */}
              <div>
                <label className="text-xs font-bold text-text-dim flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5" /> Usuários Vinculados
                </label>
                <div className="rounded-card border border-panel bg-void/20 divide-y divide-panel">
                  {selectedTenant.users.length === 0 ? (
                    <div className="p-3 text-center text-text-dim text-xs">Nenhum usuário</div>
                  ) : selectedTenant.users.map((u) => (
                    <div key={u.id} className="p-3 flex justify-between items-center text-sm">
                      <div>
                        <div className="text-text-primary">{u.name || "—"}</div>
                        <div className="text-text-dim text-xs font-mono">{u.email}</div>
                      </div>
                      <span className="text-[10px] font-bold text-quantum bg-quantum/10 px-2 py-0.5 rounded border border-quantum/20">{humanize(u.role)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grant / change plan */}
              <div>
                <label className="text-xs font-bold text-text-dim flex items-center gap-1.5 mb-2">
                  <CreditCard className="w-3.5 h-3.5" /> {activeSub ? "Trocar Plano" : "Conceder Licença"}
                </label>
                <Form method="post" className="flex items-end gap-2">
                  <input type="hidden" name="intent" value="add_subscription" />
                  <input type="hidden" name="tenantId" value={selectedTenant.id} />
                  <select name="planId" defaultValue={activeSub?.plan.id ?? ""} required className="flex-1 text-xs bg-void border border-panel rounded-btn py-2.5 px-3 text-text-primary focus:ring-1 focus:ring-quantum focus:border-quantum appearance-none cursor-pointer">
                    <option value="">Selecione um plano...</option>
                    {products.map((product) => (
                      <optgroup key={product.id} label={product.name}>
                        {product.plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>{product.name} :: {plan.name} — ${Number(plan.price.toString()).toFixed(2)}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 bg-quantum text-void px-4 py-2.5 rounded-btn text-xs font-bold hover:bg-quantum-hover transition-all shrink-0">
                    <Plus className="w-3.5 h-3.5" /> {activeSub ? "Change" : "Grant"}
                  </button>
                </Form>
              </div>

              {/* Subscription history */}
              <div>
                <label className="text-xs font-bold text-text-dim block mb-2">Histórico de Assinaturas</label>
                <div className="rounded-card border border-panel bg-void/20 divide-y divide-panel">
                  {selectedTenant.subscriptions.length === 0 && (
                    <div className="p-3 text-center text-text-dim text-xs">Nenhuma assinatura</div>
                  )}
                  {selectedTenant.subscriptions.map((sub) => (
                    <div key={sub.id} className="p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <StatusBadge status={sub.status} />
                        {sub.status === "ACTIVE" && (
                          <button onClick={() => setConfirmAction({ type: "CANCEL", subscriptionId: sub.id })} title="Cancel" className="p-1 text-text-dim hover:text-orange-500 hover:bg-orange-500/10 rounded transition-colors">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setConfirmAction({ type: "DELETE", subscriptionId: sub.id })} title="Delete" className="p-1 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-sm text-text-secondary">{sub.plan.product.name} / {sub.plan.name}</div>
                      <code className="text-[10px] font-mono bg-void px-1.5 py-0.5 rounded border border-panel text-text-dim block w-fit">{sub.licenseKey}</code>
                      <div className="flex items-center gap-1.5 text-[10px] text-text-dim font-mono">
                        <Calendar className="w-3 h-3" /> {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit tenant modal */}
      {editingTenant && selectedTenant && mounted && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-orbital border border-panel rounded-card shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-panel flex justify-between items-center bg-void/50">
              <h2 className="text-sm font-bold text-text-primary">Edit Tenant</h2>
              <button onClick={() => setEditingTenant(false)} className="text-text-dim hover:text-white">✕</button>
            </div>
            <Form method="post" className="p-6 space-y-4">
              <input type="hidden" name="intent" value="update_tenant" />
              <input type="hidden" name="tenantId" value={selectedTenant.id} />
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Name</label>
                <input name="name" defaultValue={selectedTenant.name} required className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Slug</label>
                <input name="slug" defaultValue={selectedTenant.slug} required className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum font-mono" />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-quantum hover:bg-quantum-hover text-void px-5 py-2 rounded font-bold text-sm transition-all">Save Changes</button>
              </div>
            </Form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm cancel/delete subscription */}
      {confirmAction && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-orbital border border-error/30 rounded-card shadow-[0_0_50px_rgba(239,68,68,0.2)] w-full max-w-sm overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-error/50 via-error to-error/50"></div>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4 border border-error/20">
                {confirmAction.type === "DELETE" ? <Trash2 className="w-7 h-7 text-error" /> : <Ban className="w-7 h-7 text-error" />}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{confirmAction.type === "DELETE" ? "Excluir assinatura?" : "Cancelar assinatura?"}</h3>
              <p className="text-sm text-text-secondary mb-6">
                {confirmAction.type === "DELETE" ? "Ação permanente, não pode ser desfeita." : "A licença será revogada — o produto para de aceitar essa chave."}
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setConfirmAction(null)} className="px-4 py-2 rounded bg-void border border-panel text-text-secondary hover:text-white text-xs font-bold">Cancel</button>
                <Form method="post" onSubmit={() => setConfirmAction(null)}>
                  <input type="hidden" name="intent" value={confirmAction.type === "DELETE" ? "delete_subscription" : "cancel_subscription"} />
                  <input type="hidden" name="subscriptionId" value={confirmAction.subscriptionId} />
                  <input type="hidden" name="tenantId" value={selectedTenant?.id} />
                  <button type="submit" className="px-4 py-2 rounded bg-error/90 hover:bg-error text-white text-xs font-bold">Confirmar</button>
                </Form>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
