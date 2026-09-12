import type { SubscriptionRepository } from '../../domain/subscription/subscription.repository.js';

export interface ValidateAccessInput {
	licenseKey: string;
}

export interface ValidateAccessOutput {
	valid: boolean;
	capabilities: string[];
	limits?: unknown;
}

/**
 * Valida uma licença e resolve as capabilities (feature flags) do tenant:
 * features do plano + overrides específicos do tenant, sem duplicatas.
 */
export class ValidateAccessUseCase {
	constructor(
		private readonly subscriptionRepository: SubscriptionRepository,
	) {}

	async execute(input: ValidateAccessInput): Promise<ValidateAccessOutput> {
		const subscription =
			await this.subscriptionRepository.findByLicenseKeyWithFeatures(
				input.licenseKey,
			);

		if (!subscription) return { valid: false, capabilities: [] };
		if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') {
			return { valid: false, capabilities: [] };
		}
		if (subscription.tenant.status !== 'ACTIVE')
			return { valid: false, capabilities: [] };

		const baseFeatures = subscription.plan.features;
		const overrideFeatures = (subscription.tenant.features ?? []).map(
			(f) => f.feature,
		);
		const capabilities = Array.from(
			new Set([...baseFeatures, ...overrideFeatures]),
		);

		return { valid: true, capabilities, limits: subscription.plan.limits };
	}
}
