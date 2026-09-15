import { prisma } from '../db';
import { describeReason, validateLicense, type OrbitValidateResult } from './orbit-client';

export interface LiveLicenseStatus {
  licenseStatus: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  licenseBlockReason: string | null;
  modules: string[];
  limits: unknown;
  banners: OrbitValidateResult['banners'];
  /** true quando não foi possível falar com o Orbit agora — dado local mantido como está. */
  stale: boolean;
}

/**
 * Revalida a licença de uma barbearia contra o Orbit e persiste o resultado
 * localmente (cache com TTL). Esse é o único ponto de verdade em runtime —
 * qualquer rota/UI que precise saber se o tenant está com acesso liberado
 * deve passar por aqui (direta ou indiretamente via GET /api/barbershop/license-status),
 * nunca ler `licenseStatus` do banco sem revalidar quando estiver velho.
 */
export async function syncLicenseStatus(barbershopId: string): Promise<LiveLicenseStatus | null> {
  const shop = await prisma.barbershop.findUnique({ where: { id: barbershopId } });
  if (!shop) return null;

  // Trial local não tem licenseKey no Orbit — nada pra revalidar, é sempre "ACTIVE" localmente.
  if (!shop.licenseKey || shop.licenseKey === 'TRIAL-VERSION') {
    return {
      licenseStatus: shop.licenseStatus,
      licenseBlockReason: shop.licenseBlockReason,
      modules: shop.modules,
      limits: shop.limits,
      banners: [],
      stale: false,
    };
  }

  const result = await validateLicense(shop.licenseKey);

  if (!result) {
    return {
      licenseStatus: shop.licenseStatus,
      licenseBlockReason: shop.licenseBlockReason,
      modules: shop.modules,
      limits: shop.limits,
      banners: [],
      stale: true,
    };
  }

  const licenseStatus = result.valid ? 'ACTIVE' : 'EXPIRED';
  const licenseBlockReason = result.valid ? null : describeReason(result.reason);

  await prisma.barbershop.update({
    where: { id: barbershopId },
    data: {
      licenseStatus,
      licenseBlockReason,
      modules: result.capabilities,
      limits: (result.limits ?? {}) as object,
      licenseCheckedAt: new Date(),
    },
  });

  return {
    licenseStatus,
    licenseBlockReason,
    modules: result.capabilities,
    limits: result.limits,
    banners: result.banners,
    stale: false,
  };
}
