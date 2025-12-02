/**
 * License Engine - Core logic for resolving tenant permissions and features.
 * 
 * This module implements the business logic for determining which features
 * are available to a tenant based on their plan and feature overrides.
 */

import { prisma } from "../../core/db/prisma.server";
import { TenantService } from "../../core/domain/tenant/tenant.service";
import type { ValidateAccessInput, ValidateAccessOutput } from "./license.types";

/**
 * Resolves the final set of features (permissions) available to a tenant.
 * 
 * This function:
 * 1. Fetches the tenant and its associated base plan
 * 2. Gets the list of base features from the plan
 * 3. Fetches all specific feature overrides from the TenantFeature table
 * 4. Combines the base features and overrides into a final, unique list
 * 
 * @param tenantId - The unique identifier of the tenant
 * @returns Promise resolving to an array of unique feature strings (e.g., ['COUPONS', 'WHATSAPP'])
 * @throws Error if the tenant is not found
 */
export async function resolvePermissions(tenantId: string): Promise<string[]> {
  // 1. Fetch tenant with plan
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      plan: true,
    },
  });

  if (!tenant) {
    throw new Error(`Tenant with id "${tenantId}" not found`);
  }

  // 2. Get base features from plan (if tenant has a plan)
  const baseFeatures: string[] = tenant.plan?.features || [];

  // 3. Fetch tenant-specific feature overrides
  const tenantFeatures = await prisma.tenantFeature.findMany({
    where: { tenantId },
    select: {
      feature: true,
    },
  });

  const overrideFeatures = tenantFeatures.map((tf) => tf.feature);

  // 4. Combine base features and overrides into a unique set
  const featureSet = new Set<string>();

  // Add all base features from the plan
  baseFeatures.forEach((feature) => featureSet.add(feature));

  // Add all override features (Set automatically handles duplicates)
  overrideFeatures.forEach((feature) => featureSet.add(feature));

  // Convert Set to array and return
  return Array.from(featureSet);
}

/**
 * Validates access for a license key and returns the capabilities if valid.
 * 
 * This function performs the following validation checks:
 * 1. Finds tenant by license key (slug). If not found, returns invalid.
 * 2. Checks if tenant's subscription status is ACTIVE. If not, returns invalid.
 * 3. Checks if request origin matches tenant's configured domain (if domain is configured).
 * 
 * If all checks pass, resolves and returns the tenant's capabilities.
 * 
 * @param input - Validation input containing licenseKey and origin
 * @returns Promise resolving to validation result with valid flag and capabilities
 */
export async function validateAccess(
  input: ValidateAccessInput
): Promise<ValidateAccessOutput> {
  // 1. Find tenant by license key (slug)
  const tenant = await TenantService.findTenantByLicenseKey(input.licenseKey);

  if (!tenant) {
    return { valid: false, capabilities: [] };
  }

  // 2. Check if tenant's subscription status is ACTIVE
  // Status must be exactly 'ACTIVE' to be valid
  if (tenant.status !== "ACTIVE") {
    return { valid: false, capabilities: [] };
  }

  // 3. Check if request origin matches tenant's configured domain
  // Note: Domain field is not yet in the Prisma schema.
  // When domain is added to the schema, this check will validate:
  // - If tenant.domain is null/empty, any origin is allowed
  // - If tenant.domain has a value, it must strictly match input.origin
  // For now, this check always passes (domain validation will be implemented when field is added)
  // TODO: Implement domain validation when domain field is added to Tenant model

  // 4. All checks passed - resolve permissions and return valid response
  // Usar a função exportada para permitir mocking em testes
  const capabilities = await resolvePermissions(tenant.id);

  return {
    valid: true,
    capabilities,
  };
}

// Exportar uma versão que aceita resolvePermissions como parâmetro para testes
export async function validateAccessWithResolver(
  input: ValidateAccessInput,
  resolver: (tenantId: string) => Promise<string[]> = resolvePermissions
): Promise<ValidateAccessOutput> {
  // 1. Find tenant by license key (slug)
  const tenant = await TenantService.findTenantByLicenseKey(input.licenseKey);

  if (!tenant) {
    return { valid: false, capabilities: [] };
  }

  // 2. Check if tenant's subscription status is ACTIVE
  // Status must be exactly 'ACTIVE' to be valid
  if (tenant.status !== "ACTIVE") {
    return { valid: false, capabilities: [] };
  }

  // 3. Check if request origin matches tenant's configured domain
  // Note: Domain field is not yet in the Prisma schema.
  // When domain is added to the schema, this check will validate:
  // - If tenant.domain is null/empty, any origin is allowed
  // - If tenant.domain has a value, it must strictly match input.origin
  // For now, this check always passes (domain validation will be implemented when field is added)
  // TODO: Implement domain validation when domain field is added to Tenant model

  // 4. All checks passed - resolve permissions and return valid response
  // Usar o resolver injetado para permitir mocking em testes
  const capabilities = await resolver(tenant.id);

  return {
    valid: true,
    capabilities,
  };
}

