import { createContext, useContext } from "react";

/**
 * Carrega o nonce de CSP gerado por requisição (entry.server.tsx) até o
 * <Scripts nonce={...}> em root.tsx. Só tem valor durante SSR — no client,
 * o script de hidratação já está no DOM, então o nonce não é necessário
 * depois da primeira renderização.
 */
export const NonceContext = createContext<string>("");

export function useNonce() {
  return useContext(NonceContext);
}
