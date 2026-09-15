import { type LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "../core/auth/session.server";

const ORBIT_API_URL = process.env.ORBIT_API_URL || "http://localhost:4001";
const ORBIT_API_SECRET = process.env.ORBIT_API_SECRET || "";

/**
 * Resource route (sem componente default) — o navegador baixa isso
 * diretamente via <a href>. O PDF é gerado inteiramente no backend
 * (api-orbit); aqui só repassamos a resposta binária com o secret que
 * o browser nunca deveria ver.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAdmin(request);

  const url = new URL(request.url);
  const query = url.searchParams.toString();

  const response = await fetch(`${ORBIT_API_URL}/subscriptions/export.pdf${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${ORBIT_API_SECRET}` },
  });

  if (!response.ok) {
    throw new Response("Failed to generate report", { status: 502 });
  }

  const buffer = await response.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": response.headers.get("Content-Disposition") || "attachment; filename=\"subscriptions.pdf\"",
    },
  });
};
