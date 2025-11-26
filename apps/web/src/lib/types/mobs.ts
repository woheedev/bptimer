// Application Runtime Types (not database schemas)

export interface ChannelEntry {
	channel: number;
	hp_percentage: number;
	status: 'alive' | 'dead' | 'unknown';
	last_updated?: string;
	location_image?: number;
}

export interface MobWithChannels {
	id: string;
	uid: number;
	name: string;
	type: 'boss' | 'magical_creature';
	total_channels: number;
	respawn_time?: number;
	latestChannels?: ChannelEntry[];
}
