export interface PasswordHasher {
	hash(plain: string): Promise<string>;
	compare(plain: string, hash: string): Promise<boolean>;
}

/**
 * Value Object que encapsula uma senha já hasheada. Não sabe *como* o hash é
 * feito — isso é responsabilidade do PasswordHasher (infra), injetado em
 * quem precisa verificar.
 */
export class Password {
	private constructor(private readonly hash: string) {}

	static fromHash(hash: string): Password {
		return new Password(hash);
	}

	toString(): string {
		return this.hash;
	}

	async verify(plain: string, hasher: PasswordHasher): Promise<boolean> {
		return hasher.compare(plain, this.hash);
	}
}
