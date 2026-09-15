/**
 * Security Headers Utility
 * 
 * Centralized security headers configuration following security guidelines.
 * These headers protect against common web vulnerabilities including XSS,
 * clickjacking, MIME type sniffing, and more.
 */

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Content Security Policy (CSP)
 *
 * Strict CSP configuration that allows necessary resources while blocking
 * potentially dangerous content. In development, we allow 'unsafe-inline'
 * and 'unsafe-eval' for hot module replacement and debugging.
 *
 * Em produção, o React Router injeta um <script> inline pra hidratar a
 * página (window.__reactRouterContext) — sem 'unsafe-inline' isso é
 * bloqueado pelo browser e a app inteira perde interatividade (nenhum
 * onClick funciona, só <Form> continua indo por ser submit nativo). Por
 * isso o nonce por requisição: libera só esse script específico, sem abrir
 * mão da proteção contra scripts injetados por XSS.
 */
function getContentSecurityPolicy(nonce: string): string {
  if (isDevelopment) {
    // Development: More permissive for HMR and debugging
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
  }

  // Production: Strict CSP, script-src liberado só via nonce por requisição
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/**
 * Basic Security Headers
 * 
 * Essential security headers that protect against common attacks.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent clickjacking attacks
    "X-Frame-Options": "DENY",
    
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",
    
    // Control referrer information
    "Referrer-Policy": "strict-origin-when-cross-origin",
    
    // Restrict browser features
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

/**
 * Content Security Policy Header
 */
export function getContentSecurityPolicyHeader(nonce: string): Record<string, string> {
  return {
    "Content-Security-Policy": getContentSecurityPolicy(nonce),
  };
}

/**
 * HSTS (HTTP Strict Transport Security)
 * 
 * Only set in production and when using HTTPS.
 * Forces browsers to use HTTPS for all future requests.
 */
export function getHSTSHeader(): Record<string, string> {
  if (!isProduction) {
    return {};
  }

  // Only set HSTS if we're on HTTPS
  // In production, this should be handled by the reverse proxy/load balancer
  return {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  };
}

/**
 * Composite Security Headers
 * 
 * Combines all security headers into a single object.
 * This is the main function to use when setting security headers.
 */
export function getCompositeSecurityHeaders(nonce: string): Record<string, string> {
  return {
    ...getSecurityHeaders(),
    ...getContentSecurityPolicyHeader(nonce),
    ...getHSTSHeader(),
  };
}

/**
 * Apply Security Headers to Response Headers
 * 
 * Helper function to apply all security headers to a Headers object.
 * 
 * @param headers - The Headers object to apply security headers to
 */
export function applySecurityHeaders(headers: Headers, nonce: string): void {
  const securityHeaders = getCompositeSecurityHeaders(nonce);

  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

