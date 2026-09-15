import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { useLoaderData, Form, useNavigation } from "react-router";
import { orbitApi } from "../core/orbit-api/orbit-api.server";
import { Megaphone, Plus, Trash2, Link as LinkIcon, Info, AlertTriangle, XCircle, CheckCircle2, Sparkles } from "lucide-react";

type BannerType = "INFO" | "WARNING" | "ERROR" | "SUCCESS" | "UPDATE";

interface BannerItem {
  id: string;
  productId: string | null;
  tenantId: string | null;
  type: BannerType;
  message: string;
  link: string | null;
  isActive: boolean;
}

interface ProductOption {
  id: string;
  name: string;
}

interface TenantOption {
  id: string;
  name: string;
}

const TYPE_META: Record<BannerType, { label: string; icon: typeof Info; className: string }> = {
  INFO: { label: "Informação", icon: Info, className: "bg-quantum/10 text-quantum border-quantum/20" },
  WARNING: { label: "Aviso", icon: AlertTriangle, className: "bg-warning/10 text-warning border-warning/20" },
  ERROR: { label: "Erro", icon: XCircle, className: "bg-error/10 text-error border-error/20" },
  SUCCESS: { label: "Sucesso", icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" },
  UPDATE: { label: "Novidade", icon: Sparkles, className: "bg-quantum/10 text-quantum border-quantum/20" },
};

export const loader = async (_: LoaderFunctionArgs) => {
  const [banners, products, tenants] = await Promise.all([
    orbitApi.get<BannerItem[]>("/banners"),
    orbitApi.get<ProductOption[]>("/products"),
    orbitApi.get<TenantOption[]>("/tenants"),
  ]);

  return { banners, products, tenants };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const productId = (formData.get("productId") as string) || null;
    const tenantId = (formData.get("tenantId") as string) || null;
    const type = formData.get("type") as string;
    const message = formData.get("message") as string;
    const link = (formData.get("link") as string) || null;

    if (!message) return null;

    await orbitApi.post("/banners", { productId, tenantId, type, message, link });
    return redirect("/admin/banners");
  }

  if (intent === "toggle") {
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await orbitApi.patch(`/banners/${id}`, { isActive: !isActive });
    return redirect("/admin/banners");
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await orbitApi.delete(`/banners/${id}`);
    return redirect("/admin/banners");
  }

  return null;
};

export default function AdminBanners() {
  const { banners, products, tenants } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-0 font-sans max-w-7xl mx-auto space-y-8">
      <div className="border-b border-panel pb-6">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">
          Banner Broadcasts
        </h1>
        <p className="text-text-secondary max-w-xl">
          Avisos padronizados entregues a todos os produtos via GET /validate. Cada produto
          renderiza com a própria identidade visual — o dado (tipo, mensagem, link) é único aqui.
        </p>
      </div>

      {/* Create form */}
      <div className="bg-orbital border border-panel rounded-card p-6">
        <h3 className="text-xs font-bold text-text-dim mb-4">
          Novo Banner
        </h3>
        <Form method="post" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="hidden" name="intent" value="create" />

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Tipo</label>
            <select
              name="type"
              defaultValue="INFO"
              className="w-full text-xs bg-void border border-panel rounded-btn py-2.5 px-3 text-text-primary focus:ring-1 focus:ring-quantum focus:border-quantum"
            >
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="SUCCESS">Success</option>
              <option value="UPDATE">Update</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Link (opcional)</label>
            <input
              type="url"
              name="link"
              placeholder="https://..."
              className="w-full text-xs bg-void border border-panel rounded-btn py-2.5 px-3 text-text-primary focus:ring-1 focus:ring-quantum focus:border-quantum"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Produto</label>
            <select
              name="productId"
              className="w-full text-xs bg-void border border-panel rounded-btn py-2.5 px-3 text-text-primary focus:ring-1 focus:ring-quantum focus:border-quantum"
            >
              <option value="">Todos os produtos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Tenant</label>
            <select
              name="tenantId"
              className="w-full text-xs bg-void border border-panel rounded-btn py-2.5 px-3 text-text-primary focus:ring-1 focus:ring-quantum focus:border-quantum"
            >
              <option value="">Todos os tenants</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-text-secondary mb-1.5">Mensagem</label>
            <input
              type="text"
              name="message"
              required
              placeholder="Nos ajude a melhorar: preencha essa pesquisa..."
              className="w-full text-xs bg-void border border-panel rounded-btn py-2.5 px-3 text-text-primary focus:ring-1 focus:ring-quantum focus:border-quantum"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-quantum text-void px-5 py-2.5 rounded-btn text-sm font-semibold hover:bg-quantum-hover transition-all"
            >
              <Plus size={16} />
              Publicar Banner
            </button>
          </div>
        </Form>
      </div>

      {/* List */}
      <div className="bg-orbital border border-panel rounded-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[200px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-panel bg-void/50">
                <th className="p-4 pl-6 text-xs font-bold text-text-dim">Tipo</th>
                <th className="p-4 text-xs font-bold text-text-dim">Mensagem</th>
                <th className="p-4 text-xs font-bold text-text-dim">Escopo</th>
                <th className="p-4 text-xs font-bold text-text-dim">Status</th>
                <th className="p-4 pr-6 text-xs font-bold text-text-dim text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel">
              {banners.map((banner) => {
                const meta = TYPE_META[banner.type];
                const Icon = meta.icon;
                const product = products.find((p) => p.id === banner.productId);
                const tenant = tenants.find((t) => t.id === banner.tenantId);

                return (
                  <tr key={banner.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 pl-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border ${meta.className}`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="p-4 max-w-md">
                      <div className="text-sm text-text-primary">{banner.message}</div>
                      {banner.link && (
                        <a href={banner.link} target="_blank" rel="noreferrer" className="text-xs text-quantum flex items-center gap-1 mt-1 hover:underline">
                          <LinkIcon className="w-3 h-3" />
                          {banner.link}
                        </a>
                      )}
                    </td>
                    <td className="p-4 text-xs text-text-secondary">
                      {product ? product.name : "Todos os produtos"}
                      {tenant ? ` / ${tenant.name}` : ""}
                    </td>
                    <td className="p-4">
                      <Form method="post">
                        <input type="hidden" name="intent" value="toggle" />
                        <input type="hidden" name="id" value={banner.id} />
                        <input type="hidden" name="isActive" value={String(banner.isActive)} />
                        <button
                          type="submit"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border ${banner.isActive
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-text-dim/10 text-text-dim border-text-dim/20"
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${banner.isActive ? "bg-success animate-pulse" : "bg-text-dim"}`}></span>
                          {banner.isActive ? "Ativo" : "Inativo"}
                        </button>
                      </Form>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={banner.id} />
                        <button
                          type="submit"
                          className="w-8 h-8 rounded flex items-center justify-center bg-void border border-panel text-text-secondary hover:text-error hover:border-error/50 transition-all ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Form>
                    </td>
                  </tr>
                );
              })}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-text-dim text-xs">
                    <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Nenhum banner publicado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
