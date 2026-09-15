import { type LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "../core/auth/session.server";

const ORBIT_API_URL = process.env.ORBIT_API_URL || "http://localhost:4001";
const ORBIT_API_SECRET = process.env.ORBIT_API_SECRET || "";

/**
 * Resource route (sem componente default) — mesmo padrão de
 * admin.subscriptions.export.tsx, só que pro relatório agrupado por tenant.
 * PDF gerado inteiramente no backend; aqui só repassamos o binário.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAdmin(request);

  const url = new URL(request.url);
  const query = url.searchParams.toString();

  const response = await fetch(`${ORBIT_API_URL}/tenants/export.pdf${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${ORBIT_API_SECRET}` },
  });

  if (!response.ok) {
    throw new Response("Failed to generate report", { status: 502 });
  }

  const buffer = await response.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": response.headers.get("Content-Disposition") || "attachment; filename=\"tenants.pdf\"",
    },
  });
};
