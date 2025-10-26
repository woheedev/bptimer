import { z } from 'zod';

// User schema
export const userSchema = z.object({
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	snowflake: z
		.string()
		.regex(/^[0-9]+$/)
		.min(17)
		.max(20),
	created: z.string(),
	updated: z.string(),
	username: z.string().min(1).max(100),
	nickname: z.string().min(1).max(100).optional(),
	email: z.email(),
	emailVisibility: z.boolean().optional(),
	verified: z.boolean(),
	avatar: z.string().optional(),
	reputation: z.number().int().optional().default(0)
});

export type User = z.infer<typeof userSchema>;

// API Key schema
export const apiKeySchema = z.object({
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	user: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	api_key: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(50)
		.max(50),
	created: z.string(),
	updated: z.string()
});

export type ApiKey = z.infer<typeof apiKeySchema>;

// Map schema
export const mapSchema = z.object({
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	uid: z.number().int().min(1).max(10),
	name: z.string().min(1).max(100),
	total_channels: z.number().int().min(1).max(1000)
});

export type Map = z.infer<typeof mapSchema>;

// Channel schema
export const channelSchema = z.object({
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	number: z.number().int().min(1).max(1000),
	map: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15), // Map relation ID
	full: z.boolean().optional()
});

export type Channel = z.infer<typeof channelSchema>;

// Mob schema
export const mobSchema = z.object({
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	uid: z.number().int().min(1).max(40),
	type: z.enum(['boss', 'magical_creature']),
	name: z.string().min(1).max(100),
	map: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	respawn_time: z.number().int().min(0).max(59).optional()
});

export type Mob = z.infer<typeof mobSchema>;

// HP report schema
export const hpReportSchema = z.object({
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	created: z.string(),
	updated: z.string(),
	mob: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	hp_percentage: z.number().int().min(0).max(100),
	channel: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	full: z.boolean().optional(),
	reporter: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	upvotes: z.number().int().min(0).optional().default(0),
	downvotes: z.number().int().min(0).optional().default(0)
});

export type HpReport = z.infer<typeof hpReportSchema>;

// Vote schema
export const voteSchema = z.object({
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	created: z.string(),
	updated: z.string(),
	report: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	voter: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	vote_type: z.enum(['up', 'down'])
});

export type Vote = z.infer<typeof voteSchema>;

// Mob channel status schema
export const mobChannelStatusSchema = z.object({
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	mob: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	channel: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	last_hp: z.number().int().min(0).max(100).nullable(),
	last_update: z.string()
});

export type MobChannelStatus = z.infer<typeof mobChannelStatusSchema>;

// Channel management schema
export const channelStatusSchema = z.object({
	map: z.string(),
	channel: z.string(),
	full: z.boolean()
});

export type ChannelStatusSchema = z.infer<typeof channelStatusSchema>;

// Input validation schemas for frontend
export const searchQuerySchema = z.string().min(0).max(100).trim();

export const hpReportInputSchema = z.object({
	mobId: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	channel: z.number().int().min(1).max(1000),
	hp_percentage: z.number().int().min(0).max(100)
});

// Schema for HP submission input (without mobId, which is provided by parent)
export const hpSubmissionInputSchema = z.object({
	channel: z.number().int().min(1).max(1000),
	hp_percentage: z.number().int().min(0).max(100)
});

export const voteInputSchema = z.object({
	reportId: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.min(15)
		.max(15),
	voteType: z.enum(['up', 'down'])
});

// Input types
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type HpReportInput = z.infer<typeof hpReportInputSchema>;
export type HpSubmissionInput = z.infer<typeof hpSubmissionInputSchema>;
export type VoteInput = z.infer<typeof voteInputSchema>;
