import { ValidationError } from '../../../app/http/errors/validation-error.js';
import type { Banner } from '../../domain/banner/banner.entity.js';
import type {
	BannerRepository,
	CreateBannerData,
	UpdateBannerData,
} from '../../domain/banner/banner.repository.js';

export class ListBannersUseCase {
	constructor(private readonly bannerRepository: BannerRepository) {}

	async execute(): Promise<Banner[]> {
		return this.bannerRepository.list();
	}
}

export class CreateBannerUseCase {
	constructor(private readonly bannerRepository: BannerRepository) {}

	async execute(data: CreateBannerData): Promise<Banner> {
		if (!data.message?.trim())
			throw new ValidationError('message é obrigatório');
		return this.bannerRepository.create(data);
	}
}

export class UpdateBannerUseCase {
	constructor(private readonly bannerRepository: BannerRepository) {}

	async execute(id: string, data: UpdateBannerData): Promise<Banner> {
		return this.bannerRepository.update(id, data);
	}
}

export class DeleteBannerUseCase {
	constructor(private readonly bannerRepository: BannerRepository) {}

	async execute(id: string): Promise<void> {
		return this.bannerRepository.delete(id);
	}
}
