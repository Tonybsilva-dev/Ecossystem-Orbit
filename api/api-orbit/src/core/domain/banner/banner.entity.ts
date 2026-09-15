export type BannerType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'UPDATE';

export interface Banner {
	id: string;
	productId: string | null;
	tenantId: string | null;
	type: BannerType;
	message: string;
	link: string | null;
	isActive: boolean;
	startsAt: Date | null;
	endsAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

/** Shape enxuto entregue a produtos consumidores via GET /validate. */
export interface BannerSummary {
	id: string;
	type: BannerType;
	message: string;
	link: string | null;
}
