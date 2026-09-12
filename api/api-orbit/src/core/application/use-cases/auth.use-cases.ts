import { UnauthorizedError } from '../../../app/http/errors/unauthorized-error.js';
import type { PublicUser } from '../../domain/user/user.entity.js';
import type { UserRepository } from '../../domain/user/user.repository.js';
import type { PasswordHasher } from '../../domain/value-objects/password.js';
import { Password } from '../../domain/value-objects/password.js';

export interface LoginInput {
	email: string;
	password: string;
}

/**
 * Autentica o operador da plataforma. O operador é uma linha em `User` como
 * qualquer outra — não há tabela separada de admins, a distinção é
 * operacional (é quem gerencia tenants/planos/kill switch).
 */
export class LoginUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly passwordHasher: PasswordHasher,
	) {}

	async execute(input: LoginInput): Promise<PublicUser> {
		const user = await this.userRepository.findByEmail(input.email);
		if (!user?.passwordHash) {
			throw new UnauthorizedError('Invalid email or password');
		}

		const isValid = await Password.fromHash(user.passwordHash).verify(
			input.password,
			this.passwordHasher,
		);
		if (!isValid) {
			throw new UnauthorizedError('Invalid email or password');
		}

		const { passwordHash: _passwordHash, ...publicUser } = user;
		return publicUser;
	}
}

export class GetUserUseCase {
	constructor(private readonly userRepository: UserRepository) {}

	async execute(userId: string): Promise<PublicUser | null> {
		const user = await this.userRepository.findById(userId);
		if (!user) return null;
		const { passwordHash: _passwordHash, ...publicUser } = user;
		return publicUser;
	}
}
