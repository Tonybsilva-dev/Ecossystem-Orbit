import type { FastifyInstance } from 'fastify';
import {
	GetUserUseCase,
	LoginUseCase,
} from '../../../core/application/use-cases/auth.use-cases.js';
import type { AppContainer } from '../container.js';
import { NotFoundError } from '../errors/not-found-error.js';
import { ValidationError } from '../errors/validation-error.js';
import { requireOperator } from '../middlewares/require-operator.js';

/**
 * Autentica o operador da plataforma (o único admin do Orbit). O usuário
 * operador é uma linha em `User` como qualquer outra — não há tabela
 * separada de admins; a distinção é operacional (é o dono do produto).
 */
export async function authRoutes(
	app: FastifyInstance,
	options: { container: AppContainer },
) {
	const { container } = options;

	app.post('/auth/login', async (request, reply) => {
		const body = request.body as { email?: string; password?: string };
		if (!body.email || !body.password) {
			throw new ValidationError('email e password são obrigatórios');
		}

		const useCase = new LoginUseCase(
			container.userRepository,
			container.passwordHasher,
		);
		const user = await useCase.execute({
			email: body.email,
			password: body.password,
		});
		return reply.send({
			userId: user.id,
			email: user.email,
			role: user.role,
			tenantId: user.tenantId,
		});
	});

	// Usado por requireAdmin no backend do web/orbit pra checar role da sessão.
	app.get(
		'/auth/users/:id',
		{ preHandler: requireOperator },
		async (request) => {
			const { id } = request.params as { id: string };
			const user = await new GetUserUseCase(container.userRepository).execute(
				id,
			);
			if (!user) throw new NotFoundError('User not found');
			return user;
		},
	);
}
