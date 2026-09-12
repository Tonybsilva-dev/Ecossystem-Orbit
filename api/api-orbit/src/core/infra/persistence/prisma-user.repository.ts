import type { PrismaClient } from '@prisma/client';
import type { User } from '../../domain/user/user.entity.js';
import type {
	CreateUserData,
	UserRepository,
} from '../../domain/user/user.repository.js';

export class PrismaUserRepository implements UserRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findById(id: string): Promise<User | null> {
		return this.prisma.user.findUnique({ where: { id } });
	}

	async findByEmail(email: string): Promise<User | null> {
		return this.prisma.user.findUnique({ where: { email } });
	}

	async create(data: CreateUserData): Promise<User> {
		return this.prisma.user.create({ data });
	}
}
