import type { BannerRepository } from '../../domain/banner/banner.repository.js';
import type { BannerSummary } from '../../domain/banner/banner.entity.js';
import type { SubStatus } from '../../domain/subscription/subscription.entity.js';
import type { SubscriptionRepository } from '../../domain/subscription/subscription.repository.js';
import type { TenantStatus } from '../../domain/tenant/tenant.entity.js';

export interface ValidateAccessInput {
	licenseKey: string;
}

export type ValidateAccessReason =
	| 'LICENSE_NOT_FOUND'
	| 'SUBSCRIPTION_INACTIVE'
	| 'TENANT_SUSPENDED';

export interface ValidateAccessOutput {
	valid: boolean;
	reason: ValidateAccessReason | null;
	tenantStatus: TenantStatus | null;
	subscriptionStatus: SubStatus | null;
	capabilities: string[];
	limits?: unknown;
	banners: BannerSummary[];
}

function toBannerSummary(
	banners: { id: string; type: string; message: string; link: string | null }[],
): BannerSummary[] {
	return banners.map((b) => ({
		id: b.id,
		type: b.type as BannerSummary['type'],
		message: b.message,
		link: b.link,
	}));
}

/**
 * Endpoint único de entitlement que um produto consumidor consulta: valida a
 * licença, resolve capabilities (feature flags) e devolve os avisos vigentes.
 *
 * Capabilities = plan.includedFeatures (relação, fonte de verdade) ∪
 * plan.features (array legado, mantido durante a migração) ∪ overrides do
 * tenant (TenantFeature — sempre aditivo, nunca revoga).
 *
 * O kill switch (tenant.status !== ACTIVE) e assinatura fora de
 * ACTIVE/TRIAL bloqueiam o acesso, mas o motivo (`reason`) é diferenciado
 * para que o produto consumidor saiba o que comunicar ao usuário.
 */
export class ValidateAccessUseCase {
	constructor(
		private readonly subscriptionRepository: SubscriptionRepository,
		private readonly bannerRepository: BannerRepository,
	) {}

	async execute(input: ValidateAccessInput): Promise<ValidateAccessOutput> {
		const subscription =
			await this.subscriptionRepository.findByLicenseKeyWithFeatures(
				input.licenseKey,
			);

		if (!subscription) {
			return {
				valid: false,
				reason: 'LICENSE_NOT_FOUND',
				tenantStatus: null,
				subscriptionStatus: null,
				capabilities: [],
				banners: [],
			};
		}

		const banners = toBannerSummary(
			await this.bannerRepository.findActiveFor(
				subscription.plan.product.id,
				subscription.tenant.id,
			),
		);

		if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') {
			return {
				valid: false,
				reason: 'SUBSCRIPTION_INACTIVE',
				tenantStatus: subscription.tenant.status as TenantStatus,
				subscriptionStatus: subscription.status,
				capabilities: [],
				banners,
			};
		}

		if (subscription.tenant.status !== 'ACTIVE') {
			return {
				valid: false,
				reason: 'TENANT_SUSPENDED',
				tenantStatus: subscription.tenant.status as TenantStatus,
				subscriptionStatus: subscription.status,
				capabilities: [],
				banners,
			};
		}

		const relationFeatures = (subscription.plan.includedFeatures ?? []).map(
			(f) => f.key,
		);
		const legacyFeatures = subscription.plan.features;
		const overrideFeatures = (subscription.tenant.features ?? []).map(
			(f) => f.feature,
		);
		const merged = new Set([
			...relationFeatures,
			...legacyFeatures,
			...overrideFeatures,
		]);

		// Kill switch por feature: qualquer key correspondente a uma Feature
		// com isEnabled=false é removida, mesmo que o plano ou um override do
		// tenant a concedessem. Vale pra todos os tenants do produto.
		const disabledKeys = new Set(
			(subscription.plan.product.features ?? [])
				.filter((f) => !f.isEnabled)
				.map((f) => f.key),
		);
		const capabilities = Array.from(merged).filter(
			(key) => !disabledKeys.has(key),
		);

		return {
			valid: true,
			reason: null,
			tenantStatus: subscription.tenant.status as TenantStatus,
			subscriptionStatus: subscription.status,
			capabilities,
			limits: subscription.plan.limits,
			banners,
		};
	}
}
