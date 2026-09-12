export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface User {
	id: string;
	email: string;
	name: string | null;
	passwordHash: string;
	role: UserRole;
	tenantId: string;
	createdAt: Date;
	updatedAt: Date;
}

export type PublicUser = Omit<User, 'passwordHash'>;
