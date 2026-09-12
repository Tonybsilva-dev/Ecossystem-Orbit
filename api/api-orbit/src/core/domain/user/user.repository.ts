import type { User, UserRole } from './user.entity.js';

export interface CreateUserData {
	email: string;
	name?: string | null;
	passwordHash: string;
	role: UserRole;
	tenantId: string;
}

export interface UserRepository {
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	create(data: CreateUserData): Promise<User>;
}
