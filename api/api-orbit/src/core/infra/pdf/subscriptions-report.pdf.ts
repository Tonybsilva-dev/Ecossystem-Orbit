import type { SubscriptionWithRelations } from '../../domain/subscription/subscription.entity.js';
import { generatePdfTableReport, type PdfColumn } from './pdf-table.js';

export interface SubscriptionsReportFilters {
	search?: string;
	productName?: string;
	status?: string;
}

const COLUMNS: readonly PdfColumn[] = [
	{ label: 'Tenant', width: 130 },
	{ label: 'Produto / Plano', width: 130 },
	{ label: 'Status', width: 70 },
	{ label: 'License Key', width: 100 },
	{ label: 'Criado em', width: 75 },
];

function describeFilters(filters: SubscriptionsReportFilters): string | null {
	const parts: string[] = [];
	if (filters.productName) parts.push(`Produto: ${filters.productName}`);
	if (filters.status) parts.push(`Status: ${filters.status}`);
	if (filters.search) parts.push(`Busca: "${filters.search}"`);
	return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Gera o PDF do relatório de assinaturas inteiramente no backend — o
 * frontend só baixa o binário pronto (ver GET /subscriptions/export.pdf).
 */
export function generateSubscriptionsReportPdf(
	subscriptions: SubscriptionWithRelations[],
	filters: SubscriptionsReportFilters,
): Promise<Buffer> {
	return generatePdfTableReport({
		title: 'Relatório de Assinaturas — Orbit',
		subtitle: `Gerado em ${new Date().toLocaleString('pt-BR')} · ${subscriptions.length} assinatura(s)`,
		filterLine: describeFilters(filters),
		columns: COLUMNS,
		rows: subscriptions.map((sub) => [
			sub.tenant.name,
			`${sub.plan.product.name} / ${sub.plan.name}`,
			sub.status,
			sub.licenseKey,
			new Date(sub.createdAt).toLocaleDateString('pt-BR'),
		]),
		emptyMessage: 'Nenhuma assinatura encontrada para os filtros aplicados.',
	});
}
