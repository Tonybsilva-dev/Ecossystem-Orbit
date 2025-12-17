import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { useLoaderData, Form, useNavigation } from "react-router";
import { prisma } from "../core/db/prisma.server";
import { TenantService } from "../core/domain/tenant/tenant.service";
import { Users, Plus, ChevronRight, Activity, ShieldCheck, CreditCard, Search } from "lucide-react";
import { useEffect } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [tenants, products] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        users: { take: 1, where: { role: 'OWNER' } },
        subscriptions: {
          include: {
            plan: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.findMany({
      include: { plans: true }
    })
  ]);

  const transformedTenants = tenants.map(t => ({
    ...t,
    subscriptions: t.subscriptions.map(s => ({
      ...s,
      plan: {
        ...s.plan,
        price: s.plan.price.toString()
      }
    }))
  }));

  const transformedProducts = products.map(p => ({
    ...p,
    plans: p.plans.map(plan => ({
      ...plan,
      price: plan.price.toString()
    }))
  }));

  return { tenants: transformedTenants, products: transformedProducts };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "add_subscription") {
    const tenantId = formData.get("tenantId") as string;
    const planId = formData.get("planId") as string;

    if (!tenantId || !planId) return null;

    await TenantService.addSubscription(tenantId, planId);

    return redirect("/admin/tenants");
  }

  return null;
};

export default function AdminTenants() {
  const { tenants, products } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const details = document.querySelectorAll('details.group\\/details');
      details.forEach((detail) => {
        if (detail.hasAttribute('open') && !detail.contains(event.target as Node)) {
          detail.removeAttribute('open');
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="p-0 font-sans max-w-7xl mx-auto space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-panel pb-6 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight font-mono mb-2">
            Tenant_Directory
          </h1>
          <p className="text-text-secondary max-w-xl">
            Active client instances and subscription status.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim w-4 h-4 group-focus-within:text-quantum transition-colors" />
            <input
              type="text"
              placeholder="SEARCH_TENANTS..."
              className="bg-orbital border border-panel rounded-btn py-2 pl-9 pr-4 text-xs font-mono text-text-primary focus:outline-none focus:border-quantum focus:ring-1 focus:ring-quantum transition-all w-64 uppercase"
            />
          </div>
          <button className="flex items-center gap-2 bg-quantum text-white px-5 py-2.5 rounded-btn text-sm font-semibold hover:bg-quantum-hover hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all font-mono tracking-wide">
            <Plus size={16} />
            <span>NEW_TENANT</span>
          </button>
        </div>
      </div>

      <div className="bg-orbital border border-panel rounded-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-panel bg-void/50">
                <th className="p-4 pl-6 font-mono text-xs font-bold text-text-dim uppercase tracking-wider">Inst. Identifier</th>
                <th className="p-4 font-mono text-xs font-bold text-text-dim uppercase tracking-wider">System Status</th>
                <th className="p-4 font-mono text-xs font-bold text-text-dim uppercase tracking-wider">Active Modules</th>
                <th className="p-4 pr-6 font-mono text-xs font-bold text-text-dim uppercase tracking-wider text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-panel flex items-center justify-center shrink-0 border border-white/5">
                        <ShieldCheck className="w-4 h-4 text-text-dim group-hover:text-quantum transition-colors" />
                      </div>
                      <div>
                        <div className="font-bold text-text-primary text-sm font-mono tracking-wide">{tenant.name}</div>
                        <div className="text-xs text-text-dim font-mono mt-0.5">{tenant.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wide uppercase border ${tenant.status === 'ACTIVE'
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-text-dim/10 text-text-dim border-text-dim/20'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'ACTIVE' ? 'bg-success animate-pulse' : 'bg-text-dim'}`}></span>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {tenant.subscriptions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tenant.subscriptions.map(sub => (
                          <div key={sub.id} className="flex items-center gap-2 bg-void border border-panel px-2.5 py-1.5 rounded text-xs">
                            <CreditCard className="w-3 h-3 text-quantum" />
                            <span className="text-text-secondary font-medium">{sub.plan.product.name}</span>
                            <span className="text-text-dim">/</span>
                            <span className="text-text-primary">{sub.plan.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-text-dim italic text-xs font-mono">NO_ACTIVE_PLANS</span>
                    )}
                  </td>
                  <td className="p-4 text-right pr-6 relative">
                    <details className="inline-block text-left group/details">
                      <summary className="list-none cursor-pointer bg-void border border-panel text-text-secondary w-8 h-8 rounded flex items-center justify-center hover:text-white hover:border-quantum/50 transition-all shadow-sm">
                        <ChevronRight className="w-4 h-4 group-open/details:rotate-90 transition-transform duration-200" />
                      </summary>

                      <div className="absolute right-8 top-0 mt-0 w-[340px] bg-orbital border border-panel rounded-card z-[50] p-5 hidden group-open/details:block shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] origin-top-right animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/10">
                        <h4 className="text-xs font-bold text-text-dim font-mono uppercase mb-4 text-left tracking-wider border-b border-panel pb-2">Modify Access Rights</h4>

                        <Form method="post">
                          <input type="hidden" name="intent" value="add_subscription" />
                          <input type="hidden" name="tenantId" value={tenant.id} />

                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs text-text-secondary mb-1.5 font-mono">Select Plan Tier</label>
                              <div className="relative">
                                <select
                                  name="planId"
                                  className="w-full text-xs font-mono bg-void border border-panel rounded-btn py-2.5 px-3 text-text-primary focus:ring-1 focus:ring-quantum focus:border-quantum appearance-none cursor-pointer hover:bg-void/70 transition-colors"
                                  required
                                >
                                  <option value="" className="bg-orbital text-text-dim">SELECT_CONFIGURATION...</option>
                                  {products.map(product => (
                                    <optgroup key={product.id} label={product.name} className="bg-orbital text-white font-bold">
                                      {product.plans.map(plan => (
                                        <option key={plan.id} value={plan.id} className="bg-orbital text-text-secondary font-normal">
                                          {product.name} :: {plan.name} — ${Number(plan.price.toString()).toFixed(2)}
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim">
                                  <ChevronRight className="w-3 h-3 rotate-90" />
                                </div>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full bg-quantum text-white py-2.5 rounded-btn text-xs font-bold hover:bg-quantum-hover hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all font-mono uppercase tracking-wide flex items-center justify-center gap-2"
                            >
                              {isSubmitting ? <Activity className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                              {isSubmitting ? 'PROVISIONING...' : 'GRANT_LICENSE'}
                            </button>
                          </div>
                        </Form>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
