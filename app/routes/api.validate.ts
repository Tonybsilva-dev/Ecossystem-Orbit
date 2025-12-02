import type { Route } from "./+types/api.validate";
import { validateAccess } from "../domains/license/license.engine";
import type { ValidateAccessInput } from "../domains/license/license.types";

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

