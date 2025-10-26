// Application Runtime Types (not database schemas)

export interface ChannelEntry {
	channel: number;
	hp_percentage: number;
	status: 'alive' | 'dead' | 'unknown';
	last_updated: string;
}

export interface MobWithChannels {
	id: string;
	uid: number;
	name: string;
	type: string;
	total_channels: number;
	latestChannels: ChannelEntry[];
}
