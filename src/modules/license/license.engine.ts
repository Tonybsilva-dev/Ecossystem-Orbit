import { prisma } from "../../shared/db.js";
import type { ValidateAccessInput, ValidateAccessOutput } from "./license.types.js";

export async function resolvePermissions(subscriptionId: string): Promise<string[]> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, tenant: { include: { features: true } } },
  });

  if (!subscription) {
    throw new Error(`Subscription with id "${subscriptionId}" not found`);
  }

  const baseFeatures = subscription.plan.features;
  const overrideFeatures = subscription.tenant.features.map((f) => f.feature);
  const featureSet = new Set<string>([...baseFeatures, ...overrideFeatures]);
  return Array.from(featureSet);
}

export async function validateAccess(input: ValidateAccessInput): Promise<ValidateAccessOutput> {
  const subscription = await prisma.subscription.findUnique({
    where: { licenseKey: input.licenseKey },
    include: { tenant: true, plan: true },
  });

  if (!subscription) return { valid: false, capabilities: [] };
  if (subscription.status !== "ACTIVE" && subscription.status !== "TRIAL") {
    return { valid: false, capabilities: [] };
  }
  if (subscription.tenant.status !== "ACTIVE") return { valid: false, capabilities: [] };

  const capabilities = await resolvePermissions(subscription.id);

  return { valid: true, capabilities, limits: subscription.plan.limits };
}
