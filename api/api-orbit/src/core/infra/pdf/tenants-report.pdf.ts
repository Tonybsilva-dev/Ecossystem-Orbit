import type { TenantWithRelations } from '../../domain/tenant/tenant.entity.js';
import { generatePdfTableReport, type PdfColumn } from './pdf-table.js';

export interface TenantsReportFilters {
	search?: string;
	productName?: string;
	planName?: string;
}

const COLUMNS: readonly PdfColumn[] = [
	{ label: 'Tenant', width: 110 },
	{ label: 'Status', width: 60 },
	{ label: 'Owner', width: 110 },
	{ label: 'Produtos / Planos', width: 145 },
];

function describeFilters(filters: TenantsReportFilters): string | null {
	const parts: string[] = [];
	if (filters.productName) parts.push(`Produto: ${filters.productName}`);
	if (filters.planName) parts.push(`Plano: ${filters.planName}`);
	if (filters.search) parts.push(`Busca: "${filters.search}"`);
	return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Relatório por tenant (não por assinatura) — cada linha agrupa TODOS os
 * produtos/planos daquele tenant numa célula só, já que um mesmo tenant
 * (mesmo email) pode ter assinaturas em vários produtos do Orbit.
 */
export function generateTenantsReportPdf(
	tenants: TenantWithRelations[],
	filters: TenantsReportFilters,
): Promise<Buffer> {
	return generatePdfTableReport({
		title: 'Relatório de Tenants — Orbit',
		subtitle: `Gerado em ${new Date().toLocaleString('pt-BR')} · ${tenants.length} tenant(s)`,
		filterLine: describeFilters(filters),
		columns: COLUMNS,
		rows: tenants.map((tenant) => [
			`${tenant.name}\n${tenant.slug}`,
			tenant.status,
			tenant.users[0]?.email ?? '—',
			tenant.subscriptions.length > 0
				? tenant.subscriptions
						.map((s) => `${s.plan.product.name}/${s.plan.name} (${s.status})`)
						.join(', ')
				: 'Nenhuma',
		]),
		emptyMessage: 'Nenhum tenant encontrado para os filtros aplicados.',
	});
}
