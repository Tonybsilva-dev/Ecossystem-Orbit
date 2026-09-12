/**
 * Cache-Control Constants
 * 
 * Centralized cache control header values for reuse across the application.
 * These constants define caching strategies for different endpoints and use cases.
 * 
 * @module cache-control.constants
 */

/**
 * Cache-Control header for license validation endpoint.
 * 
 * This configuration is optimized for the license validation API route
 * to meet the <200ms latency requirement by reducing database queries
 * for frequently accessed license keys.
 * 
 * **Directives:**
 * - `public`: Cache can be stored in public caches (CDN, proxies, browsers)
 * - `max-age=600`: Cache is considered fresh for 10 minutes (600 seconds)
 * - `stale-while-revalidate=3600`: Allow serving stale content for up to 1 hour
 *   while fetching a fresh version in the background
 * 
 * **Usage:**
 * This should be applied only to successful responses (200 status).
 * Error responses (400, 403, 500) should not be cached to ensure clients
 * always get the most up-to-date error information.
 * 
 * **Example:**
 * ```ts
 * import { LICENSE_VALIDATION_CACHE_CONTROL } from "~/core/constants/cache-control.constants";
 * 
 * headers.set("Cache-Control", LICENSE_VALIDATION_CACHE_CONTROL);
 * ```
 */
export const LICENSE_VALIDATION_CACHE_CONTROL =
  "public, max-age=600, stale-while-revalidate=3600";

