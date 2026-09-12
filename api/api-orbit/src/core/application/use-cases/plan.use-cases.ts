import { ValidationError } from '../../../app/http/errors/validation-error.js';
import type { Plan } from '../../domain/plan/plan.entity.js';
import type {
	CreatePlanData,
	PlanRepository,
	UpdatePlanData,
} from '../../domain/plan/plan.repository.js';

export class CreatePlanUseCase {
	constructor(private readonly planRepository: PlanRepository) {}

	async execute(data: CreatePlanData): Promise<Plan> {
		if (!data.name || data.price === undefined || !data.interval) {
			throw new ValidationError('name, price e interval são obrigatórios');
		}
		return this.planRepository.create(data);
	}
}

export class UpdatePlanUseCase {
	constructor(private readonly planRepository: PlanRepository) {}

	async execute(id: string, data: UpdatePlanData): Promise<Plan> {
		return this.planRepository.update(id, data);
	}
}

export class DeletePlanUseCase {
	constructor(private readonly planRepository: PlanRepository) {}

	async execute(id: string) {
		return this.planRepository.deleteOrDeactivate(id);
	}
}
