import type { Route } from "./+types/api.validate";
import { validateAccess } from "../domains/license/license.engine";
import type { ValidateAccessInput } from "../domains/license/license.types";
import { LICENSE_VALIDATION_CACHE_CONTROL } from "../core/constants/cache-control.constants";

/**
 * API Resource Route for License Validation
 * 
 * This route exposes the license validation logic as a public endpoint.
 * It accepts a licenseKey as a query parameter and validates it against
 * the tenant database, returning the validation result and capabilities.
 * 
 * GET /api/validate?licenseKey=<key>
 * 
 * Headers:
 * - Origin: The origin domain making the request
 * 
 * Response:
 * - 200: { valid: true, capabilities: string[] }
 * - 403: { valid: false, capabilities: [] }
 * - 400: { error: "Missing licenseKey or Origin header" }
 */

export async function loader({ request }: Route.LoaderArgs) {
  // Parse licenseKey from URL search parameters
  const url = new URL(request.url);
  const licenseKey = url.searchParams.get("licenseKey");

  // Get Origin from request headers
  const origin = request.headers.get("Origin") || request.headers.get("origin");

  // Validate that both licenseKey and origin are present
  if (!licenseKey) {
    return Response.json(
      { error: "Missing licenseKey query parameter" },
      { status: 400 }
    );
  }

  if (!origin) {
    return Response.json(
      { error: "Missing Origin header" },
      { status: 400 }
    );
  }

  // Call validateAccess from license engine
  try {
    const input: ValidateAccessInput = {
      licenseKey,
      origin,
    };

    const result = await validateAccess(input);

    // Return appropriate status code based on validation result
    if (result.valid) {
      return Response.json(
        {
          valid: true,
          capabilities: result.capabilities,
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            // Custom header to indicate successful validation (for cache control)
            "X-License-Valid": "true",
            // CORS headers for cross-origin requests
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Origin",
          },
        }
      );
    } else {
      return Response.json(
        {
          valid: false,
          capabilities: [],
        },
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Origin",
          },
        }
      );
    }
  } catch (error) {
    // Handle unexpected errors
    console.error("Error validating license:", error);
    return Response.json(
      {
        error: "Internal server error",
        valid: false,
        capabilities: [],
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

/**
 * Headers function to set Cache-Control for successful responses.
 * 
 * This function applies caching headers only to successful responses (200).
 * Error responses (400, 403, 500) are not cached to ensure clients always
 * get the most up-to-date error information.
 * 
 * The function checks for the custom `X-License-Valid` header set by the loader
 * to determine if the response is a successful validation (200 status).
 * 
 * @param args - Headers arguments containing loaderHeaders from the loader
 * @returns Headers object with Cache-Control for successful responses only
 */
export function headers({ loaderHeaders }: Route.HeadersArgs) {
  // Create a new Headers object from loader headers
  const responseHeaders = new Headers(loaderHeaders);

  // Check if this is a successful validation response (200 status)
  // The loader sets a custom header "X-License-Valid: true" for successful validations
  const isSuccessfulValidation = loaderHeaders.get("X-License-Valid") === "true";

  // Only apply cache to successful responses (200)
  // Error responses (400, 403, 500) should not be cached
  if (isSuccessfulValidation) {
    responseHeaders.set("Cache-Control", LICENSE_VALIDATION_CACHE_CONTROL);
  }

  return responseHeaders;
}

