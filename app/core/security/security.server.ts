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
 */
function getContentSecurityPolicy(): string {
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

  // Production: Strict CSP
  return [
    "default-src 'self'",
    "script-src 'self'",
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
export function getContentSecurityPolicyHeader(): Record<string, string> {
  return {
    "Content-Security-Policy": getContentSecurityPolicy(),
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
export function getCompositeSecurityHeaders(): Record<string, string> {
  return {
    ...getSecurityHeaders(),
    ...getContentSecurityPolicyHeader(),
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
export function applySecurityHeaders(headers: Headers): void {
  const securityHeaders = getCompositeSecurityHeaders();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

