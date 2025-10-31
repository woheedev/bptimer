// Transformed types
export interface MobReport {
	id: string;
	channel: number;
	hp_percentage: number;
	user: {
		id: string;
		name: string;
		avatar?: string;
	};
	create_time: string;
	upvotes: number;
	downvotes: number;
	reporter_id: string;
	reporter_reputation: number;
	location_image?: number;
}
