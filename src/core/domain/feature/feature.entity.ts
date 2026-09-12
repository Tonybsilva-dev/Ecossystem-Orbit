export interface Feature {
	id: string;
	productId: string;
	key: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
}
