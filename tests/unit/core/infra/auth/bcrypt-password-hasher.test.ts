import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '../../../../../src/core/infra/auth/bcrypt-password-hasher.js';

describe('BcryptPasswordHasher', () => {
	it('gera um hash verificável com a própria senha', async () => {
		const hasher = new BcryptPasswordHasher();
		const hash = await hasher.hash('senhaSegura123');

		expect(hash).not.toBe('senhaSegura123');
		expect(await hasher.compare('senhaSegura123', hash)).toBe(true);
	});

	it('rejeita senha incorreta', async () => {
		const hasher = new BcryptPasswordHasher();
		const hash = await hasher.hash('senhaSegura123');

		expect(await hasher.compare('outra-senha', hash)).toBe(false);
	});
});
