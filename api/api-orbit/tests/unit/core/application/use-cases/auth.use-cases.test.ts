import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '../../../../../src/app/http/errors/unauthorized-error.js';
import {
	GetUserUseCase,
	LoginUseCase,
} from '../../../../../src/core/application/use-cases/auth.use-cases.js';
import type { User } from '../../../../../src/core/domain/user/user.entity.js';
import type { UserRepository } from '../../../../../src/core/domain/user/user.repository.js';
import type { PasswordHasher } from '../../../../../src/core/domain/value-objects/password.js';

const user: User = {
	id: 'user-1',
	email: 'admin@orbit.com',
	name: 'Admin',
	passwordHash: 'hashed-value',
	role: 'OWNER',
	tenantId: 'tenant-1',
	createdAt: new Date(),
	updatedAt: new Date(),
};

function makeUserRepository(found: User | null): UserRepository {
	return {
		findByEmail: vi.fn().mockResolvedValue(found),
		findById: vi.fn().mockResolvedValue(found),
		create: vi.fn(),
	};
}

function makeHasher(matches: boolean): PasswordHasher {
	return { hash: vi.fn(), compare: vi.fn().mockResolvedValue(matches) };
}

describe('LoginUseCase', () => {
	it('rejeita quando o email não existe', async () => {
		const useCase = new LoginUseCase(
			makeUserRepository(null),
			makeHasher(true),
		);
		await expect(
			useCase.execute({ email: 'x@x.com', password: 'x' }),
		).rejects.toThrow(UnauthorizedError);
	});

	it('rejeita quando a senha não confere', async () => {
		const useCase = new LoginUseCase(
			makeUserRepository(user),
			makeHasher(false),
		);
		await expect(
			useCase.execute({ email: user.email, password: 'errada' }),
		).rejects.toThrow(UnauthorizedError);
	});

	it('autentica e não vaza o passwordHash', async () => {
		const useCase = new LoginUseCase(
			makeUserRepository(user),
			makeHasher(true),
		);
		const result = await useCase.execute({
			email: user.email,
			password: 'correta',
		});

		expect(result.id).toBe(user.id);
		expect(result).not.toHaveProperty('passwordHash');
	});
});

describe('GetUserUseCase', () => {
	it('retorna null quando o usuário não existe', async () => {
		const useCase = new GetUserUseCase(makeUserRepository(null));
		expect(await useCase.execute('inexistente')).toBeNull();
	});

	it('retorna o usuário sem o passwordHash', async () => {
		const useCase = new GetUserUseCase(makeUserRepository(user));
		const result = await useCase.execute(user.id);
		expect(result).not.toHaveProperty('passwordHash');
		expect(result?.role).toBe('OWNER');
	});
});
