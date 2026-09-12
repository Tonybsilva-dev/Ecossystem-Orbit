import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { useLoaderData, Form, useNavigation, useSearchParams, Link, useSubmit } from "react-router";
import { orbitApi } from "../core/orbit-api/orbit-api.server";
import {
  CreditCard,
  Search,
  MoreHorizontal,
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Ban,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

interface SubscriptionListResponse {
  subscriptions: unknown[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const search = url.searchParams.get("search") || "";
  const productId = url.searchParams.get("productId") || "";
  const status = url.searchParams.get("status") || "";
  const subscriptionId = url.searchParams.get("subscriptionId");

  const query = new URLSearchParams({ page: String(page), limit: "10", search, productId, status });

  const [productsData, subscriptionsData] = await Promise.all([
    orbitApi.get<{ id: string; name: string }[]>("/products"),
    orbitApi.get<SubscriptionListResponse>(`/subscriptions?${query}`),
  ]);

  const { subscriptions, pagination } = subscriptionsData;

  const selectedSubscription = subscriptionId
    ? await orbitApi.get(`/subscriptions/${subscriptionId}`).catch(() => null)
    : null;

  return {
    subscriptions,
    pagination,
    selectedSubscription,
    search,
    products: productsData,
    filters: { productId, status }
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const subscriptionId = formData.get("subscriptionId") as string;

  if (!subscriptionId) return null;

  if (intent === "cancel_subscription") {
    await orbitApi.post(`/subscriptions/${subscriptionId}/cancel`);
    // If we're on the drawer, redirect there. Else just back to list
    const referer = request.headers.get("referer");
    if (referer && referer.includes("subscriptionId=")) {
      return redirect(`/admin/subscriptions?subscriptionId=${subscriptionId}`);
    }
    return redirect("/admin/subscriptions");
  }

  if (intent === "delete_subscription") {
    await orbitApi.delete(`/subscriptions/${subscriptionId}`);
    // Redirect to removing the param if we deleted the open one, or just refresh list
    return redirect("/admin/subscriptions");
  }

  return null;
};

export default function AdminSubscriptions() {
  const { subscriptions, pagination, selectedSubscription, search: initialSearch, products, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filterProduct, setFilterProduct] = useState(filters.productId);
  const [filterStatus, setFilterStatus] = useState(filters.status);
  const [mounted, setMounted] = useState(false);

  // New Confirmation State
  const [confirmation, setConfirmation] = useState<{ type: 'CANCEL' | 'DELETE', id: string } | null>(null);
  const submit = useSubmit();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== initialSearch) {
        setSearchParams(prev => {
          prev.set("search", searchTerm);
          prev.set("page", "1");
          return prev;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, initialSearch, setSearchParams]);

  // Filter handlers
  const handleFilterChange = (key: string, value: string) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      prev.set("page", "1");
      return prev;
    });
  };


  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };

  const openDrawer = (id: string) => {
    setSearchParams(prev => {
      prev.set("subscriptionId", id);
      return prev;
    });
  };

  const closeDrawer = () => {
    setSearchParams(prev => {
      prev.delete("subscriptionId");
      return prev;
    });
  };

  const proceedWithAction = () => {
    if (!confirmation) return;

    const formData = new FormData();
    formData.append("subscriptionId", confirmation.id);

    if (confirmation.type === 'CANCEL') {
      formData.append("intent", "cancel_subscription");
      submit(formData, { method: "post" });
    } else if (confirmation.type === 'DELETE') {
      formData.append("intent", "delete_subscription");
      submit(formData, { method: "post" });
    }

    setConfirmation(null);
  };

  return (
    <div className="p-0 font-sans max-w-7xl mx-auto space-y-8 relative">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-panel pb-6 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight font-mono mb-2">
            Subscription_Manager
          </h1>
          <p className="text-text-secondary max-w-xl">
            Monitor active licenses, plans and recurring revenue streams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Product Filter */}
          <select
            value={filterProduct}
            onChange={(e) => {
              setFilterProduct(e.target.value);
              handleFilterChange("productId", e.target.value);
            }}
            className="bg-orbital border border-panel rounded-btn py-2 px-3 text-xs font-mono text-text-primary focus:outline-none focus:border-quantum focus:ring-1 focus:ring-quantum transition-all w-48 appearance-none"
          >
            <option value="">ALL PRODUCTS...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              handleFilterChange("status", e.target.value);
            }}
            className="bg-orbital border border-panel rounded-btn py-2 px-3 text-xs font-mono text-text-primary focus:outline-none focus:border-quantum focus:ring-1 focus:ring-quantum transition-all w-40 appearance-none"
          >
            <option value="">ALL STATUS...</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CANCELED">CANCELED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="TRIAL">TRIAL</option>
            <option value="PAST_DUE">PAST_DUE</option>
          </select>


          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim w-4 h-4 group-focus-within:text-quantum transition-colors" />
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-orbital border border-panel rounded-btn py-2 pl-9 pr-4 text-xs font-mono text-text-primary focus:outline-none focus:border-quantum focus:ring-1 focus:ring-quantum transition-all w-48 uppercase"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-orbital border border-panel rounded-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-panel bg-void/50">
                <th className="p-4 pl-6 font-mono text-xs font-bold text-text-dim uppercase tracking-wider">Status</th>
                <th className="p-4 font-mono text-xs font-bold text-text-dim uppercase tracking-wider">Tenant</th>
                <th className="p-4 font-mono text-xs font-bold text-text-dim uppercase tracking-wider">Plan / Product</th>
                <th className="p-4 font-mono text-xs font-bold text-text-dim uppercase tracking-wider">License Key</th>
                <th className="p-4 pr-6 font-mono text-xs font-bold text-text-dim uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-dim font-mono text-sm">
                    NO_SUBSCRIPTIONS_FOUND
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => openDrawer(sub.id)}>
                    <td className="p-4 pl-6">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-text-primary text-sm font-mono tracking-wide">{sub.tenant.name}</div>
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
                      <code className="text-xs font-mono bg-void px-2 py-1 rounded border border-panel text-text-secondary">
                        {sub.licenseKey.substring(0, 12)}...
                      </code>
                    </td>
                    <td className="p-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Cancel */}
                        {sub.status === 'ACTIVE' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmation({ type: 'CANCEL', id: sub.id });
                            }}
                            className="p-1.5 text-text-dim hover:text-orange-500 hover:bg-orange-500/10 rounded transition-colors"
                            title="Cancel Subscription"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}

                        {/* Quick Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmation({ type: 'DELETE', id: sub.id });
                          }}
                          className="p-1.5 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete Subscription"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button className="p-1.5 text-text-dim hover:text-white hover:bg-white/10 rounded transition-colors" onClick={() => openDrawer(sub.id)}>
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-panel p-4 flex justify-between items-center bg-void/30">
          <div className="text-xs text-text-dim font-mono">
            PAGE {pagination.page} OF {pagination.totalPages || 1}
          </div>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="px-3 py-1.5 rounded border border-panel text-text-dim hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="px-3 py-1.5 rounded border border-panel text-text-dim hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      {selectedSubscription && mounted && createPortal(
        <div className="fixed inset-y-0 right-0 left-56 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={closeDrawer} />

          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-orbital border-l border-panel h-full shadow-2xl p-0 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-panel flex justify-between items-start bg-void/30">
              <div>
                <h2 className="text-lg font-bold text-text-primary font-mono tracking-tight">Subscription Details</h2>
                <div className="text-xs text-text-dim font-mono mt-1">ID: {selectedSubscription.id}</div>
              </div>
              <button onClick={closeDrawer} className="text-text-dim hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* Status Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-text-dim font-mono uppercase tracking-wider">Current Status</label>
                <div className="flex items-center gap-4 p-4 rounded-card border border-panel bg-void/20">
                  <StatusBadge status={selectedSubscription.status} lg />
                  <div className="flex-1">
                    {selectedSubscription.status === 'ACTIVE' && (
                      <div className="text-xs text-success font-mono flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> License Valid
                      </div>
                    )}
                    {selectedSubscription.status === 'CANCELED' && (
                      <div className="text-xs text-text-dim font-mono flex items-center gap-1.5">
                        <Ban className="w-3 h-3" /> Canceled on {new Date(selectedSubscription.canceledAt!).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tenant Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-text-dim font-mono uppercase tracking-wider">Tenant Information</label>
                <div className="p-4 rounded-card border border-panel bg-void/20 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Name</span>
                    <span className="text-sm text-text-primary font-bold">{selectedSubscription.tenant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Slug</span>
                    <span className="text-sm text-text-primary font-mono">{selectedSubscription.tenant.slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Tenant Status</span>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-text-primary">{selectedSubscription.tenant.status}</span>
                  </div>
                </div>
              </div>

              {/* Plan Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-text-dim font-mono uppercase tracking-wider">Plan Details</label>
                <div className="p-4 rounded-card border border-panel bg-void/20 space-y-3">
                  <div className="flex items-center gap-3 border-b border-panel pb-3">
                    <div className="w-10 h-10 rounded bg-quantum/20 flex items-center justify-center text-quantum">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-text-primary">{selectedSubscription.plan.product.name}</div>
                      <div className="text-xs text-text-dim">{selectedSubscription.plan.name}</div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <span className="text-sm text-text-secondary">Price</span>
                    <span className="text-sm text-text-primary font-mono">${Number(selectedSubscription.plan.price.toString()).toFixed(2)} / {selectedSubscription.plan.interval}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">License Key</span>
                    <code className="text-xs text-text-primary bg-black/40 px-2 py-0.5 rounded select-all">{selectedSubscription.licenseKey}</code>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded border border-panel bg-void/10">
                  <div className="text-xs text-text-dim mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Created</div>
                  <div className="text-sm text-text-primary font-mono">{new Date(selectedSubscription.createdAt).toLocaleDateString()}</div>
                </div>
                {selectedSubscription.expiresAt ? (
                  <div className="p-3 rounded border border-panel bg-void/10">
                    <div className="text-xs text-text-dim mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Expires</div>
                    <div className={clsx("text-sm font-mono", new Date(selectedSubscription.expiresAt) < new Date() ? "text-red-500" : "text-text-primary")}>
                      {new Date(selectedSubscription.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded border border-panel bg-void/10 opacity-50">
                    <div className="text-xs text-text-dim mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Expires</div>
                    <div className="text-sm text-text-primary font-mono">Never</div>
                  </div>
                )}
              </div>

            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-panel bg-void/30 space-y-3">
              <h4 className="text-xs font-bold text-text-dim font-mono uppercase">Dangerous Zone</h4>

              {selectedSubscription.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => setConfirmation({ type: 'CANCEL', id: selectedSubscription.id })}
                  disabled={isSubmitting}
                  className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/50 py-2.5 rounded-btn text-xs font-bold transition-all font-mono uppercase flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  {isSubmitting ? 'Processing...' : 'Cancel Subscription'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setConfirmation({ type: 'DELETE', id: selectedSubscription.id })}
                disabled={isSubmitting}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 py-2.5 rounded-btn text-xs font-bold transition-all font-mono uppercase flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isSubmitting ? 'Deleting...' : 'Delete Subscription'}
              </button>

            </div>

          </div>
        </div>,
        document.body
      )}

      {/* CONFIRMATION DIALOG PORTAL */}
      {confirmation && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={clsx(
            "border rounded-card shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative bg-orbital",
            confirmation.type === 'DELETE' ? "border-error/30 shadow-error/10" : "border-orange-500/30 shadow-orange-500/10"
          )}>
            <div className={clsx(
              "absolute top-0 inset-x-0 h-1 bg-gradient-to-r",
              confirmation.type === 'DELETE' ? "from-error/50 via-error to-error/50" : "from-orange-500/50 via-orange-500 to-orange-500/50"
            )}></div>
            <div className="p-6 text-center">
              <div className={clsx(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border",
                confirmation.type === 'DELETE' ? "bg-error/10 border-error/20 text-error" : "bg-orange-500/10 border-orange-500/20 text-orange-500"
              )}>
                {confirmation.type === 'DELETE' ? <Trash2 className="w-8 h-8" /> : <Ban className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {confirmation.type === 'DELETE' ? 'Confirm Deletion' : 'Confirm Cancellation'}
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                {confirmation.type === 'DELETE'
                  ? <span>Are you sure you want to PERMANENTLY delete this subscription? <br /><span className="text-error/80 text-xs block mt-1">This action cannot be undone.</span></span>
                  : <span>Are you sure you want to cancel this subscription? <br /><span className="text-orange-500/80 text-xs block mt-1">The license will be effectively revoked.</span></span>
                }
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmation(null)}
                  className="px-4 py-2 rounded bg-void border border-panel text-text-secondary hover:text-white hover:border-white/30 transition-all font-mono text-xs font-bold"
                >
                  CANCEL
                </button>
                <button
                  onClick={proceedWithAction}
                  className={clsx(
                    "px-4 py-2 rounded text-white shadow-lg transition-all font-mono text-xs font-bold",
                    confirmation.type === 'DELETE' ? "bg-error/90 hover:bg-error" : "bg-orange-500/90 hover:bg-orange-500"
                  )}
                >
                  {confirmation.type === 'DELETE' ? 'CONFIRM_DELETE' : 'CONFIRM_CANCEL'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

function StatusBadge({ status, lg = false }: { status: string, lg?: boolean }) {
  const styles = clsx(
    "inline-flex items-center gap-1.5 rounded text-[10px] font-mono font-bold tracking-wide uppercase border",
    lg ? "px-3 py-1.5 text-xs" : "px-2.5 py-1",
    status === 'ACTIVE' && 'bg-success/10 text-success border-success/20',
    status === 'CANCELED' && 'bg-red-500/10 text-red-500 border-red-500/20',
    status === 'TRIAL' && 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    status === 'PAST_DUE' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    ['EXPIRED', 'INACTIVE'].includes(status) && 'bg-text-dim/10 text-text-dim border-text-dim/20'
  );

  return (
    <span className={styles}>
      <span className={clsx("rounded-full", lg ? "w-2 h-2" : "w-1.5 h-1.5", status === 'ACTIVE' ? 'bg-success animate-pulse' : 'bg-current')}></span>
      {status}
    </span>
  );
}
