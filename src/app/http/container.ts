import type { PrismaClient } from '@prisma/client';
import { getAiClient } from '../../core/infra/ai/ai.client.js';
import { BcryptPasswordHasher } from '../../core/infra/auth/bcrypt-password-hasher.js';
import { PrismaFeatureRepository } from '../../core/infra/persistence/prisma-feature.repository.js';
import { PrismaPlanRepository } from '../../core/infra/persistence/prisma-plan.repository.js';
import { PrismaProductRepository } from '../../core/infra/persistence/prisma-product.repository.js';
import { PrismaSubscriptionRepository } from '../../core/infra/persistence/prisma-subscription.repository.js';
import { PrismaTenantRepository } from '../../core/infra/persistence/prisma-tenant.repository.js';
import { PrismaUserRepository } from '../../core/infra/persistence/prisma-user.repository.js';

/**
 * Container simples de dependências. Em produção com mais domínios,
 * considere um DI mais robusto (tsyringe, inversify) — aqui um objeto
 * plano já cobre a necessidade de wiring repository -> use-case.
 */
export class AppContainer {
	public readonly prisma: PrismaClient;
	public readonly passwordHasher = new BcryptPasswordHasher();
	public readonly aiClient = getAiClient();

	public readonly tenantRepository: PrismaTenantRepository;
	public readonly userRepository: PrismaUserRepository;
	public readonly productRepository: PrismaProductRepository;
	public readonly planRepository: PrismaPlanRepository;
	public readonly featureRepository: PrismaFeatureRepository;
	public readonly subscriptionRepository: PrismaSubscriptionRepository;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
		this.tenantRepository = new PrismaTenantRepository(prisma);
		this.userRepository = new PrismaUserRepository(prisma);
		this.productRepository = new PrismaProductRepository(prisma);
		this.planRepository = new PrismaPlanRepository(prisma);
		this.featureRepository = new PrismaFeatureRepository(prisma);
		this.subscriptionRepository = new PrismaSubscriptionRepository(prisma);
	}
}
