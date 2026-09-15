/**
 * Cliente para o control plane (api-orbit). Único lugar do barber-flow que
 * fala com o Orbit em runtime (fora do onboarding) — qualquer futuro produto
 * do Ecossystem deve seguir o mesmo padrão: chamar /validate periodicamente
 * em vez de confiar numa cópia local congelada no signup.
 */

export type OrbitBannerType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'UPDATE';

export interface OrbitBanner {
  id: string;
  type: OrbitBannerType;
  message: string;
  link: string | null;
}

export type OrbitValidateReason =
  | 'LICENSE_NOT_FOUND'
  | 'SUBSCRIPTION_INACTIVE'
  | 'TENANT_SUSPENDED';

export interface OrbitValidateResult {
  valid: boolean;
  reason: OrbitValidateReason | null;
  tenantStatus: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | null;
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELED' | 'TRIAL' | 'PAST_DUE' | null;
  capabilities: string[];
  limits?: unknown;
  banners: OrbitBanner[];
}

const ORBIT_API_URL = process.env.ORBIT_API_URL || 'http://localhost:4001';
const PUBLIC_ORIGIN = process.env.PUBLIC_BARBERFLOW_URL || 'http://localhost:3333';

/**
 * Consulta o entitlement atual de uma licença. Nunca lança — falha de rede
 * ou do Orbit é tratada como "não foi possível confirmar agora" (o chamador
 * decide se mantém o último estado conhecido ou bloqueia).
 */
export async function validateLicense(
  licenseKey: string,
): Promise<OrbitValidateResult | null> {
  try {
    const response = await fetch(
      `${ORBIT_API_URL}/validate?licenseKey=${encodeURIComponent(licenseKey)}`,
      { headers: { Origin: PUBLIC_ORIGIN } },
    );

    if (response.status !== 200 && response.status !== 403) return null;
    return (await response.json()) as OrbitValidateResult;
  } catch (error) {
    console.error('Orbit validateLicense error:', error);
    return null;
  }
}

const REASON_LABEL: Record<OrbitValidateReason, string> = {
  LICENSE_NOT_FOUND: 'Chave de licença inválida.',
  SUBSCRIPTION_INACTIVE: 'Assinatura vencida ou cancelada.',
  TENANT_SUSPENDED: 'Conta suspensa pelo operador da plataforma.',
};

export function describeReason(reason: OrbitValidateReason | null): string | null {
  return reason ? REASON_LABEL[reason] : null;
}
