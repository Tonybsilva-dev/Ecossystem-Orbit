import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../../../../../src/app/http/errors/validation-error.js';
import {
	CreatePlanUseCase,
	DeletePlanUseCase,
	UpdatePlanUseCase,
} from '../../../../../src/core/application/use-cases/plan.use-cases.js';
import type { PlanRepository } from '../../../../../src/core/domain/plan/plan.repository.js';

describe('CreatePlanUseCase', () => {
	it('rejeita quando falta name, price ou interval', async () => {
		const repo = { create: vi.fn() } as unknown as PlanRepository;
		const useCase = new CreatePlanUseCase(repo);

		await expect(
			useCase.execute({
				productId: 'p1',
				name: '',
				price: 10,
				interval: 'MONTHLY',
				features: [],
			}),
		).rejects.toThrow(ValidationError);
		expect(repo.create).not.toHaveBeenCalled();
	});

	it('cria o plano quando os dados são válidos', async () => {
		const repo = {
			create: vi.fn().mockResolvedValue({ id: 'plan-1' }),
		} as unknown as PlanRepository;
		const useCase = new CreatePlanUseCase(repo);

		const result = await useCase.execute({
			productId: 'p1',
			name: 'Pro',
			price: 59.9,
			interval: 'MONTHLY',
			features: [],
		});

		expect(result).toEqual({ id: 'plan-1' });
	});
});

describe('UpdatePlanUseCase', () => {
	it('delega pro repositório', async () => {
		const repo = {
			update: vi.fn().mockResolvedValue({ id: 'plan-1', isActive: false }),
		} as unknown as PlanRepository;
		const useCase = new UpdatePlanUseCase(repo);

		await useCase.execute('plan-1', { isActive: false });

		expect(repo.update).toHaveBeenCalledWith('plan-1', { isActive: false });
	});
});

describe('DeletePlanUseCase', () => {
	it('delega a decisão de deletar/desativar pro repositório', async () => {
		const repo = {
			deleteOrDeactivate: vi.fn().mockResolvedValue({ deleted: true }),
		} as unknown as PlanRepository;
		const useCase = new DeletePlanUseCase(repo);

		const result = await useCase.execute('plan-1');

		expect(result).toEqual({ deleted: true });
	});
});
