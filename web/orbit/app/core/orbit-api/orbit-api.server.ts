/**
 * Cliente HTTP para api-orbit — o control plane real (tenants, planos,
 * assinaturas, kill switch). Este app (web/orbit) é só a UI admin; toda
 * regra de negócio e acesso a dados vive em api-orbit.
 *
 * Autenticação: secret compartilhado, server-to-server (mesmo padrão já
 * usado por tenant apps em /tenants/sync). Só este backend guarda o secret,
 * nunca o browser.
 */

const ORBIT_API_URL = process.env.ORBIT_API_URL || "http://localhost:4001";
const ORBIT_API_SECRET = process.env.ORBIT_API_SECRET || "";

export class OrbitApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "OrbitApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${ORBIT_API_SECRET}`);
  if (init.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${ORBIT_API_URL}${path}`, { ...init, headers });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = (data && typeof data === "object" && "error" in data ? (data as { error: string }).error : null) ||
      `Orbit API request failed (${response.status})`;
    throw new OrbitApiError(response.status, message);
  }

  return data as T;
}

export const orbitApi = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
