import type {
	ApiKey as BaseApiKey,
	HpReport as BaseHpReport,
	Map as BaseMap,
	Mob as BaseMob,
	MobChannelStatus as BaseMobChannelStatus,
	User as BaseUser,
	Vote as BaseVote
} from '$lib/schemas';

// Database Base Types
export type User = BaseUser;
export type ApiKey = BaseApiKey;
export type Map = BaseMap;
export type Mob = BaseMob;
export type HpReport = BaseHpReport;
export type Vote = BaseVote;
export type MobChannelStatus = BaseMobChannelStatus;
