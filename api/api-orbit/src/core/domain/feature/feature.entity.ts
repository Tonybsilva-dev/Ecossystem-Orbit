export interface Feature {
	id: string;
	productId: string;
	key: string;
	name: string;
	description: string | null;
	isEnabled: boolean;
	createdAt: Date;
	updatedAt: Date;
}
