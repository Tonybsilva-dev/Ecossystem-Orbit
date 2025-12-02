/**
 * License Engine - Core logic for resolving tenant permissions and features.
 * 
 * This module implements the business logic for determining which features
 * are available to a tenant based on their plan and feature overrides.
 */

import { prisma } from "../../core/db/prisma.server";

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

