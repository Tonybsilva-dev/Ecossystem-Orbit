import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { orbitApi } from "../core/orbit-api/orbit-api.server";
import { Box, Plus, Search, Activity, Users } from "lucide-react";

interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  [key: string]: unknown;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const products = await orbitApi.get<ProductListItem[]>("/products");
  const productsWithAnalytics = await Promise.all(products.map(async (p) => {
    const analytics = await orbitApi.get(`/products/${p.id}/analytics`);
    return { ...p, analytics };
  }));

  return { products: productsWithAnalytics };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "create_product") {
      const name = String(formData.get("name"));
      const slug = String(formData.get("slug"));
      const description = String(formData.get("description"));
      const logo = String(formData.get("logo"));
      await orbitApi.post("/products", { name, slug, description, logo });
    }
    // ... maintain existing logic
    if (intent === "delete_product") {
      const id = String(formData.get("id"));
      await orbitApi.delete(`/products/${id}`);
    }
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Action failed" };
  }
};

export const handle = {
  breadcrumb: () => [
    { label: 'Products' }
  ]
};

export default function AdminProducts() {
  const { products } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setIsModalOpen(false);
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="p-0 font-sans max-w-7xl mx-auto space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-panel pb-6 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight font-mono mb-2">
            Products_Registry
          </h1>
          <p className="text-text-secondary max-w-xl">
            Configure available software modules and pricing tiers.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim w-4 h-4 group-focus-within:text-quantum transition-colors" />
            <input
              type="text"
              placeholder="SEARCH_MODULES..."
              className="bg-orbital border border-panel rounded-btn py-2 pl-9 pr-4 text-xs font-mono text-text-primary focus:outline-none focus:border-quantum focus:ring-1 focus:ring-quantum transition-all w-64 uppercase"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-quantum text-white px-5 py-2.5 rounded-btn text-sm font-semibold hover:bg-quantum-hover hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all font-mono tracking-wide"
          >
            <Plus size={16} />
            <span>NEW_MODULE</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => navigate(`/admin/products/${product.id}`)}
            className="group bg-orbital border border-panel rounded-card p-0 overflow-hidden cursor-pointer hover:border-quantum/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.1)] transition-all duration-300 flex flex-col h-full"
          >
            {/* Tech Header */}
            <div className="h-1 bg-gradient-to-r from-panel via-panel to-panel group-hover:from-quantum group-hover:to-data-blue transition-all duration-500"></div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-lg bg-void border border-panel flex items-center justify-center overflow-hidden group-hover:border-quantum/30 transition-colors">
                  {product.logo ? (
                    <img src={product.logo} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <Box className="text-text-dim w-6 h-6 group-hover:text-quantum transition-colors" />
                  )}
                </div>
                <div className="px-2 py-0.5 rounded bg-panel/30 border border-panel text-[10px] font-mono text-text-dim uppercase tracking-wider">
                  Running
                </div>
              </div>

              <h2 className="text-lg font-bold text-text-primary mb-2 group-hover:text-quantum transition-colors font-mono">{product.name}</h2>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-6 flex-1">{product.description}</p>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <div className="bg-void/50 rounded p-2 border border-panel flex items-center gap-3">
                  <Users className="w-4 h-4 text-text-dim" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-dim uppercase font-mono">Clients</span>
                    <span className="text-sm font-bold text-text-primary font-mono">{product.analytics.activeSubscribers}</span>
                  </div>
                </div>
                <div className="bg-void/50 rounded p-2 border border-panel flex items-center gap-3">
                  <Activity className="w-4 h-4 text-text-dim" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-dim uppercase font-mono">Churn</span>
                    <span className="text-sm font-bold text-text-primary font-mono">{product.analytics.churnRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- CREATE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-orbital border border-panel rounded-dock shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-panel flex justify-between items-center bg-void/30">
              <h2 className="text-lg font-bold text-text-primary font-mono flex items-center gap-2">
                <Box size={18} className="text-quantum" />
                Initialize New Module
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-dim hover:text-white transition-colors">
                ✕
              </button>
            </div>
            <fetcher.Form method="post" className="p-8 space-y-5">
              <input type="hidden" name="intent" value="create_product" />

              <div>
                <label className="block text-xs font-mono font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Module Name</label>
                <input name="name" required placeholder="e.g. BarberFlow" className="w-full bg-void border border-panel rounded-btn px-4 py-2.5 outline-none text-text-primary focus:border-quantum focus:ring-1 focus:ring-quantum transition-all placeholder:text-text-dim/50" />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Slug ID</label>
                <input name="slug" required placeholder="e.g. barber-flow" className="w-full bg-void border border-panel rounded-btn px-4 py-2.5 outline-none text-text-primary focus:border-quantum focus:ring-1 focus:ring-quantum transition-all placeholder:text-text-dim/50 font-mono" />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Description</label>
                <textarea name="description" rows={3} placeholder="Brief summary of capabilities..." className="w-full bg-void border border-panel rounded-btn px-4 py-2.5 outline-none text-text-primary focus:border-quantum focus:ring-1 focus:ring-quantum transition-all placeholder:text-text-dim/50 resize-none" />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Icon URL (Optional)</label>
                <input name="logo" placeholder="https://..." className="w-full bg-void border border-panel rounded-btn px-4 py-2.5 outline-none text-text-primary focus:border-quantum focus:ring-1 focus:ring-quantum transition-all placeholder:text-text-dim/50 font-mono text-xs" />
              </div>

              <div className="flex justify-end pt-4 border-t border-panel mt-6">
                <button type="submit" className="bg-quantum text-white px-6 py-2.5 rounded-btn text-sm font-bold hover:bg-quantum-hover hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all font-mono uppercase tracking-wide">
                  {fetcher.state !== 'idle' ? 'Deploying...' : 'Deploy Module'}
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}
    </div>
  );
}
