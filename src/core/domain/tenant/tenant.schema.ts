import { z } from 'zod';

const nameSchema = z
	.string({ required_error: 'Nome é obrigatório' })
	.min(3, 'Nome deve ter no mínimo 3 caracteres')
	.max(120, 'Nome deve ter no máximo 120 caracteres')
	.trim();

const slugSchema = z
	.string({ required_error: 'Slug é obrigatório' })
	.min(3, 'Slug deve ter no mínimo 3 caracteres')
	.max(50, 'Slug deve ter no máximo 50 caracteres')
	.regex(
		/^[a-z0-9-]+$/,
		'Slug deve conter apenas letras minúsculas, números e hífens (kebab-case)',
	)
	.refine(
		(val) => !val.startsWith('-') && !val.endsWith('-'),
		'Slug não pode começar ou terminar com hífen',
	)
	.refine(
		(val) => !val.includes('--'),
		'Slug não pode conter hífens consecutivos',
	);

const planIdSchema = z
	.string()
	.uuid('ID do plano deve ser um UUID válido')
	.optional()
	.nullable();

const statusSchema = z
	.enum(['ACTIVE', 'INACTIVE', 'PAST_DUE'], {
		required_error: 'Status é obrigatório',
		invalid_type_error: 'Status deve ser ACTIVE, INACTIVE ou PAST_DUE',
	})
	.optional();

export const tenantBaseSchema = z.object({
	name: nameSchema,
	slug: slugSchema,
	planId: planIdSchema,
	status: statusSchema,
});

export const createTenantSchema = tenantBaseSchema.extend({
	user: z.object({
		email: z
			.string({ required_error: 'Email é obrigatório' })
			.email('Email inválido'),
		name: z
			.string()
			.min(2, 'Nome do usuário deve ter no mínimo 2 caracteres')
			.max(120)
			.optional()
			.nullable(),
		password: z
			.string({ required_error: 'Senha é obrigatória' })
			.min(8, 'Senha deve ter no mínimo 8 caracteres')
			.max(100, 'Senha deve ter no máximo 100 caracteres'),
	}),
});

export const updateTenantSchema = tenantBaseSchema.partial().strict();

export const tenantSearchSchema = z.object({
	query: z
		.string({ required_error: 'Query de busca é obrigatória' })
		.trim()
		.min(1, 'Query de busca não pode estar vazia')
		.max(100, 'Query de busca deve ter no máximo 100 caracteres'),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
