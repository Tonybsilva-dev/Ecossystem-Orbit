import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";
import { useLoaderData, useFetcher, useNavigate, Link, useSubmit } from "react-router";
import { useState, useEffect } from "react";
import { orbitApi } from "../core/orbit-api/orbit-api.server";

interface ProductDetail {
  id: string;
  name: string;
  plans: { id: string; price: string; [key: string]: unknown }[];
  [key: string]: unknown;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { productId } = params;
  if (!productId) throw new Error("Product ID required");

  const product = await orbitApi.get<ProductDetail>(`/products/${productId}/full`).catch(() => null);

  if (!product) throw new Response("Not Found", { status: 404 });

  const analytics = await orbitApi.get(`/products/${product.id}/analytics`);

  const serializedProduct = {
    ...product,
    analytics,
    plans: product.plans.map((p) => ({
      ...p,
      price: Number(p.price), // Decimal chega como string via JSON; front usa Number
    })),
  };

  const features = await orbitApi.get(`/products/${product.id}/features`);

  return { product: serializedProduct, features };
};

export const handle = {
  breadcrumb: (data: { product: any }) => [
    { label: 'Products', href: '/admin/products' },
    { label: data.product.name }
  ]
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    // Handle DELETE requests specifically
    if (request.method === "DELETE") {
      if (intent === "delete_plan") {
        const id = String(formData.get("id"));
        await orbitApi.delete(`/plans/${id}`);
        return { success: true };
      }

      if (intent === "delete_product") {
        const id = String(formData.get("id"));
        await orbitApi.delete(`/products/${id}`);
        return redirect("/admin/products");
      }
    }

    if (intent === "update_product") {
      const id = String(formData.get("id"));
      const name = String(formData.get("name"));
      const slug = String(formData.get("slug"));
      const description = String(formData.get("description"));
      const logo = String(formData.get("logo"));
      await orbitApi.patch(`/products/${id}`, { name, slug, description, logo });
    }

    // delete_product handled in DELETE method block above for semantic correctness,
    // but we can keep it here for fallback/POST support if needed, or remove it to enforce DELETE.
    // For now, let's keep the logic clean and move product deletion to DELETE method too if we update that button.

    // Legacy POST handlers (create/update)
    if (intent === "create_plan") {
      const productId = String(formData.get("productId"));
      const name = String(formData.get("name"));

      const priceRaw = formData.get("price");
      let price = parseFloat(String(priceRaw));
      if (isNaN(price)) price = 0;

      const interval = String(formData.get("interval")) as "MONTHLY" | "YEARLY";
      const features = String(formData.get("features")).split('\n').filter(f => f.trim() !== "");

      const featureIdsRaw = formData.getAll("featureIds");
      const featureIds = featureIdsRaw.map(String);

      const limitsRaw = String(formData.get("limits"));
      let limits = {};
      try {
        limits = JSON.parse(limitsRaw);
      } catch (e) {
        // ignore
      }

      await orbitApi.post(`/products/${productId}/plans`, { name, price, interval, features, limits, featureIds });
    }

    if (intent === "create_feature") {
      const productId = String(formData.get("productId"));
      const key = String(formData.get("key"));
      const name = String(formData.get("name"));
      const description = String(formData.get("description"));
      await orbitApi.post(`/products/${productId}/features`, { key, name, description });
    }

    if (intent === "update_feature") {
      const id = String(formData.get("id"));
      const key = String(formData.get("key"));
      const name = String(formData.get("name"));
      const description = String(formData.get("description"));
      await orbitApi.patch(`/features/${id}`, { key, name, description });
    }

    if (intent === "delete_feature") {
      const id = String(formData.get("id"));
      await orbitApi.delete(`/features/${id}`);
    }

    // Kill switch global de feature — ver ValidateAccessUseCase no api-orbit:
    // remove a capability de TODOS os tenants no /validate, independente de
    // plano ou override, até ser reativada.
    if (intent === "toggle_feature_kill_switch") {
      const id = String(formData.get("id"));
      const isEnabled = formData.get("isEnabled") === "true";
      await orbitApi.patch(`/features/${id}`, { isEnabled: !isEnabled });

      const bannerMessage = formData.get("bannerMessage");
      if (isEnabled && bannerMessage && String(bannerMessage).trim()) {
        // isEnabled=true significa que estava ligada e agora está sendo desligada.
        const productId = String(formData.get("productId"));
        await orbitApi.post("/banners", {
          productId,
          type: "WARNING",
          message: String(bannerMessage).trim(),
        });
      }
    }

    // Toggle de uma célula da matriz features x planos — substitui o set
    // completo de includedFeatures do plano (mesma semântica do modal de
    // edição de plano, só que acionado direto da matriz).
    if (intent === "toggle_plan_feature") {
      const planId = String(formData.get("planId"));
      const featureIds = formData.getAll("featureIds").map(String);
      await orbitApi.patch(`/plans/${planId}`, { featureIds });
    }

    if (intent === "update_plan") {
      const id = String(formData.get("id"));
      const name = String(formData.get("name"));

      const priceRaw = formData.get("price");
      let price = parseFloat(String(priceRaw));
      if (isNaN(price)) price = 0;

      const interval = String(formData.get("interval")) as "MONTHLY" | "YEARLY";
      const isActive = formData.get("isActive") === "on";
      // Legacy features string from comma/newline separated
      // Note: We are migrating to relation. For now, keep saving legacy array for backwards compatibility
      // But we will ALSO save the relation ids.

      const featureIdsRaw = formData.getAll("featureIds"); // Checkboxes
      const featureIds = featureIdsRaw.map(String);

      // Also construct legacy array names for display on older clients if needed
      // (Optionally fetch names from ids, but frontend has them)

      const limitsRaw = String(formData.get("limits"));
      let limits = {};
      try {
        limits = JSON.parse(limitsRaw);
      } catch (e) {
        // ignore or set empty
      }

      await orbitApi.patch(`/plans/${id}`, { name, price, interval, isActive, limits, featureIds });
    }

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Action failed" };
  }
};

export default function ProductDetails() {
  const { product, features } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  // Modal States
  const [activeModal, setActiveModal] = useState<'PRODUCT' | 'PLAN' | 'FEATURE' | null>(null);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'PLAN' | 'PRODUCT', id: string } | null>(null);
  const [killSwitchTarget, setKillSwitchTarget] = useState<any>(null);
  const [killSwitchBannerMessage, setKillSwitchBannerMessage] = useState("");
  const [publishKillSwitchBanner, setPublishKillSwitchBanner] = useState(true);

  // Feature Management State (Combobox)
  const [currentFeatures, setCurrentFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // Deduped list of all features
  const allFeatures = Array.from(new Set(product.plans.flatMap((p: any) => p.features || []))) as string[];
  const filteredFeatures = allFeatures.filter(f => !currentFeatures.includes(f) && f.toLowerCase().includes(featureInput.toLowerCase()));

  const toggleBilling = () => setBillingInterval(prev => prev === 'MONTHLY' ? 'YEARLY' : 'MONTHLY');

  // Helpers to close modal on success
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setActiveModal(null);
      setEditingItem(null);
      setDeleteConfirmation(null);
    }
    if (fetcher.state === "idle" && fetcher.data?.redirect) {
      navigate(fetcher.data.redirect);
    }
  }, [fetcher.state, fetcher.data, navigate]);

  const openProductModal = () => {
    setEditingItem(product);
    setActiveModal('PRODUCT');
  };

  const openPlanModal = (plan?: any) => {
    setEditingItem(plan || null);
    // If editing, we want to pre-check existing features
    // Plan doesn't have includedFeatures loaded by default service call above (step 288 line 20 only spreads plan)
    // We need to update ProductService to include includedFeatures in listProducts/getProductBySlug
    // For now assuming we might fail to pre-fill relation based features until service update.
    // Let's rely on legacy `features` string array for pre-fill if relation unavailable?
    // Actually, task 288 viewing product service showed we load product and spread plans.
    // We need to update `ProductService` to include `includedFeatures`. 
    // I will do that in next step. For now UI code:

    setActiveModal('PLAN');
  };

  const openFeatureModal = (feature?: any) => {
    setEditingItem(feature || null);
    setActiveModal('FEATURE');
  }

  // Planos (de qualquer intervalo) que hoje concedem essa feature — usado
  // pro "usada em N planos" e pra avisar o raio de impacto antes de desligar.
  const plansUsingFeature = (featureId: string) =>
    product.plans.filter((p: any) => p.includedFeatures?.some((inf: any) => inf.id === featureId));

  const featureStatus = (feature: any): 'ENABLED' | 'ORPHAN' | 'DISABLED' => {
    if (!feature.isEnabled) return 'DISABLED';
    if (plansUsingFeature(feature.id).length === 0) return 'ORPHAN';
    return 'ENABLED';
  };

  const openKillSwitchModal = (feature: any) => {
    setKillSwitchTarget(feature);
    setPublishKillSwitchBanner(true);
    setKillSwitchBannerMessage(`A funcionalidade "${feature.name}" está temporariamente indisponível.`);
  };

  const confirmDisableFeature = () => {
    if (!killSwitchTarget) return;
    fetcher.submit(
      {
        intent: "toggle_feature_kill_switch",
        id: killSwitchTarget.id,
        productId: product.id,
        isEnabled: "true", // estado atual (ligada) — action inverte
        bannerMessage: publishKillSwitchBanner ? killSwitchBannerMessage : "",
      },
      { method: "post" },
    );
    setKillSwitchTarget(null);
  };

  const enableFeature = (feature: any) => {
    fetcher.submit(
      { intent: "toggle_feature_kill_switch", id: feature.id, productId: product.id, isEnabled: "false" },
      { method: "post" },
    );
  };

  const togglePlanFeature = (plan: any, featureId: string, checked: boolean) => {
    const currentIds: string[] = (plan.includedFeatures ?? []).map((f: any) => f.id);
    const nextIds = checked ? [...currentIds, featureId] : currentIds.filter((id) => id !== featureId);

    const fd = new FormData();
    fd.set("intent", "toggle_plan_feature");
    fd.set("planId", plan.id);
    nextIds.forEach((id) => fd.append("featureIds", id));
    fetcher.submit(fd, { method: "post" });
  };


  const addFeature = (feature: string) => {
    const trimmed = feature.trim();
    if (trimmed && !currentFeatures.includes(trimmed)) {
      setCurrentFeatures([...currentFeatures, trimmed]);
      setFeatureInput("");
      // Keep open if selecting from list, close if typing manual enter? Let's keep input focus
    }
  };

  const removeFeature = (index: number) => {
    setCurrentFeatures(currentFeatures.filter((_, i) => i !== index));
  };

  const handleFeatureKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (featureInput) {
        addFeature(featureInput);
      } else if (isComboboxOpen && filteredFeatures.length > 0) {
        addFeature(filteredFeatures[0]); // Select first suggestion on enter if empty input? Or strict? 
        // Let's stick to input value for now to be simple
      }
    }
    if (e.key === 'Backspace' && !featureInput && currentFeatures.length > 0) {
      removeFeature(currentFeatures.length - 1);
    }
  };

  const submit = useSubmit();

  const handleDelete = () => {
    if (!deleteConfirmation) return;

    if (deleteConfirmation.type === 'PLAN') {
      fetcher.submit({ intent: "delete_plan", id: deleteConfirmation.id }, { method: "delete" });
    } else if (deleteConfirmation.type === 'PRODUCT') {
      submit({ intent: "delete_product", id: deleteConfirmation.id }, { method: "delete" });
    }
    // Dialog will close via unmount or useEffect when fetcher returns success
  };

  return (
    <div className="p-0 font-sans max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb Removed (Moved to Global Header) */}

      {/* Product Hero */}

      {/* Product Hero */}
      <div className="bg-orbital border border-panel rounded-card p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
        {/* ... (Same Product Hero) ... */}
        {/* Tech Decorator */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-quantum/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-quantum/10 transition-colors"></div>

        <div className="w-24 h-24 rounded-none bg-void border border-panel flex items-center justify-center shrink-0 relative z-10">
          {product.logo ? (
            <img src={product.logo} alt={product.name} className="w-full h-full object-cover rounded-none opacity-80" />
          ) : (
            <span className="text-3xl font-bold font-mono text-text-dim">{product.name.charAt(0)}</span>
          )}
        </div>

        <div className="flex-1 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">{product.name}</h1>
              <p className="text-sm text-text-secondary max-w-2xl">{product.description}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={openProductModal}
                className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-btn bg-panel hover:bg-panel/80 text-xs text-text-secondary hover:text-white border border-transparent hover:border-quantum/30 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Edit Config
              </button>
              <button
                onClick={() => setDeleteConfirmation({ type: 'PRODUCT', id: product.id })}
                className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-btn bg-panel hover:bg-error/10 text-xs text-error/80 hover:text-error border border-transparent hover:border-error/30 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Product
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-2 py-1 bg-void rounded border border-panel text-xs font-mono text-text-dim">
              <span className="text-quantum">Slug:</span>
              <span className="text-text-secondary">{product.slug}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-void rounded border border-panel text-xs font-mono text-text-dim">
              <span className="text-quantum">Key:</span>
              <span className="text-text-secondary">{product.apiKey}</span>
            </div>
          </div>
        </div>

        {/* Analytics (Data Block) */}
        <div className="flex gap-2 relative z-10">
          <div className="bg-void bordered border-panel rounded p-3 min-w-[100px] flex flex-col items-center justify-center">
            <span className="text-[10px] text-text-dim mb-1">MRR</span>
            <span className="text-lg font-bold text-white font-mono">R${product.analytics.mrr}</span>
          </div>
          <div className="bg-void bordered border-panel rounded p-3 min-w-[100px] flex flex-col items-center justify-center">
            <span className="text-[10px] text-text-dim mb-1">Users</span>
            <span className="text-lg font-bold text-data-blue font-mono">{product.analytics.activeSubscribers}</span>
          </div>
          <div className="bg-void bordered border-panel rounded p-3 min-w-[100px] flex flex-col items-center justify-center">
            <span className="text-[10px] text-text-dim mb-1">Churn</span>
            <span className="text-lg font-bold text-error font-mono">{product.analytics.churnRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center p-1">
          <h2 className="text-lg font-bold text-text-primary px-2 border-l-2 border-quantum">Feature Catalog</h2>
          <button onClick={() => openFeatureModal()} className="px-3 py-1.5 rounded-btn bg-panel hover:bg-panel/80 text-xs text-text-secondary hover:text-white border border-transparent hover:border-quantum/30 transition-all">
            + New Feature
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.length === 0 && (
              <div className="col-span-full text-center py-8 text-text-dim text-xs border border-dashed border-panel rounded">
                No features defined
              </div>
            )}
            {features.map((feat: any) => {
              const status = featureStatus(feat);
              const usedIn = plansUsingFeature(feat.id);
              const statusMeta = {
                ENABLED: { label: 'Ativa', className: 'bg-success/10 text-success border-success/20' },
                ORPHAN: { label: 'Órfã', className: 'bg-warning/10 text-warning border-warning/20' },
                DISABLED: { label: 'Desligada', className: 'bg-error/10 text-error border-error/20' },
              }[status];

              return (
                <div
                  key={feat.id}
                  className={`bg-orbital border p-4 rounded-card flex flex-col group transition-colors relative ${feat.isEnabled ? 'border-panel hover:border-quantum/30' : 'border-error/30'
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-text-primary text-sm">{feat.name}</h4>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-quantum mb-2 bg-void inline-block px-1.5 py-0.5 rounded self-start">{feat.key}</div>
                  <p className="text-xs text-text-secondary mb-3 flex-grow truncate">{feat.description || 'No description'}</p>

                  <div className="text-[10px] text-text-dim mb-3">
                    {usedIn.length > 0
                      ? `Usada em: ${usedIn.map((p: any) => p.name).join(', ')}`
                      : 'Não usada em nenhum plano'}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => openFeatureModal(feat)}
                      className="flex-1 text-[10px] bg-panel hover:bg-quantum hover:text-void text-text-secondary px-2 py-1.5 rounded transition-colors"
                    >
                      Edit
                    </button>
                    {feat.isEnabled ? (
                      <button
                        onClick={() => openKillSwitchModal(feat)}
                        title="Kill switch: desliga essa feature pra todos os tenants, independente de plano"
                        className="flex-1 text-[10px] bg-error/10 hover:bg-error/20 text-error px-2 py-1.5 rounded transition-colors border border-error/20"
                      >
                        Desligar
                      </button>
                    ) : (
                      <button
                        onClick={() => enableFeature(feat)}
                        className="flex-1 text-[10px] bg-success/10 hover:bg-success/20 text-success px-2 py-1.5 rounded transition-colors border border-success/20"
                      >
                        Religar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Matrix — comparação instantânea de quais planos concedem quais features,
          sem precisar abrir modal por modal. Toggle na célula = auto-save. */}
      <div className="space-y-4">
        <div className="flex justify-between items-center p-1">
          <h2 className="text-lg font-bold text-text-primary px-2 border-l-2 border-quantum">Feature Matrix</h2>
          <span className="text-[10px] text-text-dim">{billingInterval === 'MONTHLY' ? 'Monthly Plans' : 'Yearly Plans'}</span>
        </div>

        <div className="bg-orbital border border-panel rounded-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-panel bg-void/50">
                  <th className="p-3 pl-4 text-xs font-bold text-text-dim">Feature</th>
                  {product.plans.filter((p: any) => p.interval === billingInterval).map((plan: any) => (
                    <th key={plan.id} className="p-3 text-xs font-bold text-text-dim text-center">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-panel">
                {features.map((feat: any) => (
                  <tr key={feat.id} className={!feat.isEnabled ? 'opacity-40' : ''}>
                    <td className="p-3 pl-4">
                      <div className="text-sm text-text-primary font-medium">{feat.name}</div>
                      <div className="text-[10px] text-text-dim font-mono">{feat.key}</div>
                    </td>
                    {product.plans.filter((p: any) => p.interval === billingInterval).map((plan: any) => {
                      const checked = plan.includedFeatures?.some((inf: any) => inf.id === feat.id) ?? false;
                      return (
                        <td key={plan.id} className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!feat.isEnabled}
                            onChange={(e) => togglePlanFeature(plan, feat.id, e.target.checked)}
                            title={!feat.isEnabled ? 'Feature desligada globalmente — religue antes de atribuir a um plano' : undefined}
                            className="w-4 h-4 accent-quantum cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {features.length === 0 && (
                  <tr>
                    <td colSpan={product.plans.filter((p: any) => p.interval === billingInterval).length + 1} className="p-6 text-center text-text-dim text-xs">
                      No features defined
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center p-1">
          <h2 className="text-lg font-bold text-text-primary px-2 border-l-2 border-quantum">Subscription Plans</h2>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {/* Tech Toggle */}
            <div className="bg-orbital border border-panel p-1 rounded flex items-center">
              <button
                onClick={() => setBillingInterval('MONTHLY')}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${billingInterval === 'MONTHLY' ? 'bg-panel text-white shadow-sm' : 'text-text-dim hover:text-text-secondary'}`}
              >
                Monthly
              </button>
              <div className="w-[1px] h-4 bg-panel mx-1"></div>
              <button
                onClick={() => setBillingInterval('YEARLY')}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${billingInterval === 'YEARLY' ? 'bg-panel text-white shadow-sm' : 'text-text-dim hover:text-text-secondary'}`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {product.plans
            .filter((plan: any) => plan.interval === billingInterval)
            .map((plan: any) => (
              <div key={plan.id} className="group relative bg-orbital border border-panel rounded-card p-5 hover:border-quantum/50 transition-all duration-200 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-text-primary text-base mb-1">{plan.name}</h4>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${plan.isActive ? 'bg-success animate-pulse' : 'bg-error'}`}></div>
                      <span className="text-[10px] text-text-dim">{plan.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  {product.analytics.activeSubscribers > 0 && (
                    <span className="text-[9px] font-bold bg-data-blue/10 text-data-blue px-1.5 py-0.5 rounded border border-data-blue/20">
                      Popular
                    </span>
                  )}
                </div>

                <div className="mb-6 pb-6 border-b border-panel/50">
                  <span className="text-3xl font-bold text-white font-mono tracking-tighter">
                    <span className="text-sm text-text-dim font-sans mr-0.5 align-top">R$</span>
                    {Number(plan.price).toFixed(2)}
                  </span>
                  <span className="text-text-dim text-xs ml-1">/{plan.interval === 'MONTHLY' ? 'mo' : 'yr'}</span>
                  {plan.interval === 'YEARLY' && (
                    <div className="mt-1 text-[10px] font-bold text-success">Savings applied</div>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-grow">
                  {(plan.includedFeatures ?? []).length === 0 ? (
                    <li className="text-xs text-text-dim italic">
                      Nenhuma feature atribuída — use a Feature Matrix acima.
                    </li>
                  ) : (
                    plan.includedFeatures.map((feat: any) => {
                      const isKilled = !feat.isEnabled;
                      return (
                        <li key={feat.id} className={`text-xs flex items-start gap-2 ${isKilled ? 'text-text-dim' : 'text-text-secondary'}`}>
                          <div className={`mt-0.5 w-3 h-3 rounded flex items-center justify-center shrink-0 ${isKilled ? 'bg-error/10' : 'bg-quantum/10'}`}>
                            <div className={`w-1.5 h-1.5 rounded-[1px] ${isKilled ? 'bg-error' : 'bg-quantum'}`}></div>
                          </div>
                          <span className={`leading-snug ${isKilled ? 'line-through' : ''}`}>{feat.name}</span>
                          {isKilled && <span className="text-[9px] text-error shrink-0">Off</span>}
                        </li>
                      );
                    })
                  )}
                </ul>

                <button
                  onClick={() => openPlanModal(plan)}
                  className="w-full py-2 rounded border border-panel bg-void text-xs font-bold text-text-secondary hover:text-white hover:border-quantum/50 hover:bg-panel transition-all"
                >
                  Configure
                </button>
              </div>
            ))}

          {/* Create Plan Button */}
          <button
            onClick={() => openPlanModal()}
            className="border border-dashed border-panel rounded-card p-4 flex flex-col items-center justify-center text-text-dim hover:text-quantum hover:border-quantum/30 hover:bg-void transition-all group min-h-[300px]"
          >
            <span className="w-10 h-10 rounded bg-orbital border border-panel flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </span>
            <span className="text-xs font-bold">{billingInterval === 'MONTHLY' ? 'New Monthly Plan' : 'New Yearly Plan'}</span>
          </button>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Product Config Modal */}
      {activeModal === 'PRODUCT' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-orbital border border-panel rounded-card shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-panel flex justify-between items-center bg-void/50">
              <h2 className="text-sm font-bold text-text-primary">Configure Product</h2>
              <button onClick={() => setActiveModal(null)} className="text-text-dim hover:text-white">✕</button>
            </div>
            <fetcher.Form method="post" className="p-6 space-y-4">
              <input type="hidden" name="intent" value="update_product" />
              <input type="hidden" name="id" value={product.id} />

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Name</label>
                <input name="name" defaultValue={product.name} required className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Slug</label>
                <input name="slug" defaultValue={product.slug} required className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum transition-colors font-mono" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Logo URL</label>
                <input name="logo" defaultValue={product.logo || ''} className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum transition-colors font-mono" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Description</label>
                <textarea name="description" defaultValue={product.description || ''} rows={3} className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum transition-colors resize-none" />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation({ type: 'PRODUCT', id: product.id })}
                  className="text-xs text-error/80 hover:text-error hover:underline"
                >
                  Delete Permanently
                </button>
                <button type="submit" className="bg-quantum hover:bg-quantum-hover text-void px-5 py-2 rounded font-bold text-sm shadow-lg shadow-quantum/20 transition-all">
                  {fetcher.state !== 'idle' ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}

      {/* Plan Config Modal */}
      {activeModal === 'PLAN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-orbital border border-panel rounded-card shadow-2xl w-full max-w-lg overflow-visible animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-4 border-b border-panel flex justify-between items-center bg-void/50 rounded-t-card">
              <h2 className="text-sm font-bold text-text-primary">{editingItem ? 'Edit Plan' : 'New Plan'}</h2>
              <button onClick={() => setActiveModal(null)} className="text-text-dim hover:text-white">✕</button>
            </div>

            <fetcher.Form method="post" className="p-6 space-y-5 bg-orbital rounded-b-card">
              <input type="hidden" name="intent" value={editingItem ? 'update_plan' : 'create_plan'} />
              <input type="hidden" name="productId" value={product.id} />
              {editingItem && <input type="hidden" name="id" value={editingItem.id} />}
              <textarea hidden name="features" value={currentFeatures.join('\n')} readOnly />

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Plan Name</label>
                <input name="name" defaultValue={editingItem?.name} required placeholder="Ex: Basic, Pro..." className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5">Price</label>
                  <input type="number" step="0.01" min="0" name="price" defaultValue={editingItem ? Number(editingItem.price) : 0} required className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum transition-colors font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5">Interval</label>
                  <select name="interval" defaultValue={editingItem?.interval || billingInterval} className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum transition-colors font-mono">
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              {/* NEW FEATURES SELECTION */}
              <div className="border-t border-panel pt-4 mt-4">
                <label className="block text-xs font-bold text-text-secondary mb-3">Enabled Modules (Catalog)</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-panel rounded bg-void/30">
                  {features.map((f: any) => {
                    const isChecked = editingItem?.includedFeatures?.some((inf: any) => inf.id === f.id)
                      || editingItem?.features?.includes(f.key);

                    return (
                      <label key={f.id} className="flex items-center gap-2 cursor-pointer hover:bg-void p-1 rounded">
                        <input type="checkbox" name="featureIds" value={f.id} defaultChecked={isChecked} className="accent-quantum" />
                        <span className="text-xs text-text-secondary">{f.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* LIMITS JSON */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Quotas / Limits (JSON)</label>
                <textarea
                  name="limits"
                  defaultValue={JSON.stringify(editingItem?.limits || { max_appointments: -1 }, null, 2)}
                  rows={5}
                  className="w-full bg-void border border-panel rounded px-3 py-2 text-xs text-text-source font-mono outline-none focus:border-quantum transition-colors"
                />
                <p className="text-[10px] text-text-dim mt-1">Format: {"{\"key\": value}"}. Use -1 for unlimited.</p>
              </div>

              {editingItem && (
                <div className="flex items-center gap-3 bg-void p-3 rounded border border-panel mt-4">
                  <input type="checkbox" name="isActive" defaultChecked={editingItem.isActive} id="isActive" className="w-4 h-4 accent-quantum bg-orbital border-panel rounded" />
                  <label htmlFor="isActive" className="text-xs font-bold text-text-secondary cursor-pointer">Active for Sales</label>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-panel mt-2">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmation({ type: 'PLAN', id: editingItem.id })}
                    className="text-xs text-error/80 hover:text-error hover:underline"
                  >
                    Delete
                  </button>
                ) : <span></span>}

                <button type="submit" className="bg-quantum hover:bg-quantum-hover text-void px-5 py-2 rounded font-bold text-sm shadow-lg shadow-quantum/20 transition-all">
                  {fetcher.state !== 'idle' ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div >
      )}

      {/* Feature Config Modal */}
      {activeModal === 'FEATURE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-orbital border border-panel rounded-card shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-panel flex justify-between items-center bg-void/50">
              <h2 className="text-sm font-bold text-text-primary">{editingItem ? 'Edit Feature' : 'New Feature'}</h2>
              <button onClick={() => setActiveModal(null)} className="text-text-dim hover:text-white">✕</button>
            </div>
            <fetcher.Form method="post" className="p-6 space-y-4">
              <input type="hidden" name="intent" value={editingItem ? 'update_feature' : 'create_feature'} />
              <input type="hidden" name="productId" value={product.id} />
              {editingItem && <input type="hidden" name="id" value={editingItem.id} />}

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Name</label>
                <input name="name" defaultValue={editingItem?.name} required className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Key (Code)</label>
                <input name="key" defaultValue={editingItem?.key} required className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum transition-colors font-mono" placeholder="e.g. appointments_module" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Description</label>
                <textarea name="description" defaultValue={editingItem?.description || ''} rows={3} className="w-full bg-void border border-panel rounded px-3 py-2 text-sm text-white outline-none focus:border-quantum transition-colors resize-none" />
              </div>

              <div className="pt-2 flex justify-between items-center">
                {editingItem ? (
                  <button
                    type="submit"
                    name="intent"
                    value="delete_feature"
                    onClick={(e) => {
                      if (!confirm('Delete this feature? It may affect plans.')) e.preventDefault();
                    }}
                    className="text-xs text-error/80 hover:text-error hover:underline"
                  >
                    Delete
                  </button>
                ) : <span></span>}

                <button type="submit" className="bg-quantum hover:bg-quantum-hover text-void px-5 py-2 rounded font-bold text-sm shadow-lg shadow-quantum/20 transition-all">
                  {fetcher.state !== 'idle' ? 'Saving...' : 'Save Feature'}
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}

      {/* KILL SWITCH CONFIRMATION — desligar uma feature é global, afeta todos
          os tenants de todos os planos que a incluem, então mostra o raio de
          impacto e oferece publicar um banner explicando o motivo. */}
      {killSwitchTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-orbital border border-error/30 rounded-card shadow-[0_0_50px_rgba(239,68,68,0.2)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-error/50 via-error to-error/50"></div>
            <div className="p-6">
              <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4 border border-error/20">
                <svg className="w-7 h-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-2">Desligar "{killSwitchTarget.name}"?</h3>
              <p className="text-sm text-text-secondary text-center mb-4">
                Isso remove essa feature de <strong className="text-error">todos os tenants</strong>, independente de plano — kill switch global, não afeta apenas um cliente.
              </p>

              {(() => {
                const affectedPlans = plansUsingFeature(killSwitchTarget.id);
                return affectedPlans.length > 0 ? (
                  <div className="bg-void border border-panel rounded p-3 mb-4 text-xs text-text-secondary">
                    <span className="text-text-dim">Impacto: </span>
                    {affectedPlans.length} plano(s) — {affectedPlans.map((p: any) => p.name).join(', ')}
                  </div>
                ) : (
                  <div className="bg-void border border-panel rounded p-3 mb-4 text-xs text-text-dim">
                    Não usada em nenhum plano hoje — desligar não afeta assinantes atuais.
                  </div>
                );
              })()}

              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishKillSwitchBanner}
                  onChange={(e) => setPublishKillSwitchBanner(e.target.checked)}
                  className="w-4 h-4 accent-quantum"
                />
                <span className="text-xs font-bold text-text-secondary">Publicar banner explicando</span>
              </label>
              {publishKillSwitchBanner && (
                <textarea
                  value={killSwitchBannerMessage}
                  onChange={(e) => setKillSwitchBannerMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-void border border-panel rounded px-3 py-2 text-xs text-white outline-none focus:border-quantum transition-colors resize-none mb-2"
                />
              )}

              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={() => setKillSwitchTarget(null)}
                  className="px-4 py-2 rounded bg-void border border-panel text-text-secondary hover:text-white hover:border-white/30 transition-all text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDisableFeature}
                  className="px-4 py-2 rounded bg-error/90 hover:bg-error text-white shadow-lg transition-all text-xs font-bold"
                >
                  Confirmar Desligamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {
        deleteConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-orbital border border-error/30 rounded-card shadow-[0_0_50px_rgba(239,68,68,0.2)] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-error/50 via-error to-error/50"></div>
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4 border border-error/20">
                  <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
                <p className="text-sm text-text-secondary mb-6">
                  Are you sure you want to permanently delete this {deleteConfirmation.type === 'PLAN' ? 'Plan' : 'Product'}? <br />
                  <span className="text-error font-bold block mt-1">This will also delete associated plans and features.</span>
                  <span className="text-error/80 text-xs block mt-1">This action cannot be undone.</span>
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setDeleteConfirmation(null)}
                    className="px-4 py-2 rounded bg-void border border-panel text-text-secondary hover:text-white hover:border-white/30 transition-all text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded bg-error/90 hover:bg-error text-white shadow-lg transition-all text-xs font-bold"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}
