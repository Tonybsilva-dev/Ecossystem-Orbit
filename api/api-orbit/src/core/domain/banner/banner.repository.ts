import type { Banner, BannerType } from './banner.entity.js';

export interface CreateBannerData {
	productId?: string | null;
	tenantId?: string | null;
	type?: BannerType;
	message: string;
	link?: string | null;
	isActive?: boolean;
	startsAt?: Date | null;
	endsAt?: Date | null;
}

export type UpdateBannerData = Partial<CreateBannerData>;

export interface BannerRepository {
	list(): Promise<Banner[]>;
	findById(id: string): Promise<Banner | null>;
	create(data: CreateBannerData): Promise<Banner>;
	update(id: string, data: UpdateBannerData): Promise<Banner>;
	delete(id: string): Promise<void>;
	/**
	 * Avisos vigentes para um produto/tenant: globais (productId null),
	 * do produto inteiro (tenantId null) ou específicos do tenant — sempre
	 * ativos e dentro da janela startsAt/endsAt, se definida.
	 */
	findActiveFor(productId: string, tenantId: string): Promise<Banner[]>;
}
