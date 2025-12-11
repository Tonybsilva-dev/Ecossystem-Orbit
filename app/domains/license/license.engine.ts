import { prisma } from "../../core/db/prisma.server";
import { TenantService } from "../../core/domain/tenant/tenant.service";
import type { ValidateAccessInput, ValidateAccessOutput } from "./license.types";

/**
 * Resolves permissions for a specific subscription.
 */
export async function resolvePermissions(subscriptionId: string): Promise<string[]> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: true,
      tenant: {
        include: {
          features: true
        }
      }
    }
  });

  if (!subscription) {
    throw new Error(`Subscription with id "${subscriptionId}" not found`);
  }

  // Base features from the Plan
  const baseFeatures = subscription.plan.features;

  // Tenant global overrides
  const overrideFeatures = subscription.tenant.features.map(f => f.feature);

  // Combine
  const featureSet = new Set<string>([...baseFeatures, ...overrideFeatures]);
  return Array.from(featureSet);
}

/**
 * Validates access for a license key.
 */
export async function validateAccess(
  input: ValidateAccessInput
): Promise<ValidateAccessOutput> {
  // 1. Find Subscription by license key
  const subscription = await prisma.subscription.findUnique({
    where: { licenseKey: input.licenseKey },
    include: {
      tenant: true,
      plan: true
    }
  });

  if (!subscription) {
    return { valid: false, capabilities: [] };
  }

  // 2. Check Subscription Status
  if (subscription.status !== "ACTIVE" && subscription.status !== "TRIAL") {
    return { valid: false, capabilities: [] };
  }

  // 3. Check Tenant Status
  if (subscription.tenant.status !== "ACTIVE") {
    return { valid: false, capabilities: [] };
  }

  // 4. Resolve permissions
  const capabilities = await resolvePermissions(subscription.id);

  return {
    valid: true,
    capabilities,
  };
}

export async function validateAccessWithResolver(
  input: ValidateAccessInput,
  resolver: (subId: string) => Promise<string[]> = resolvePermissions
): Promise<ValidateAccessOutput> {
  const subscription = await prisma.subscription.findUnique({
    where: { licenseKey: input.licenseKey },
    include: { tenant: true }
  });

  if (!subscription || (subscription.status !== "ACTIVE" && subscription.status !== "TRIAL") || subscription.tenant.status !== "ACTIVE") {
    return { valid: false, capabilities: [] };
  }

  const capabilities = await resolver(subscription.id);

  return {
    valid: true,
    capabilities,
  };
}

