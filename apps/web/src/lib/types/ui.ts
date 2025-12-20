// UI Component Types
import type { Component } from 'svelte';

export type PageItem = {
	title: string;
	url: string;
	icon?: Component;
	comingSoon?: boolean;
	external?: boolean;
	variant?: 'default' | 'outline' | 'primary';
	badge?: string;
	badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
};

export type Region = 'NA' | 'SEA';

export interface RegionOption {
	value: Region;
	label: string;
}

// Filter and Sort Types
export type SortField = 'channel' | 'hp' | 'report_time';
export type SortDirection = 'ascending' | 'descending';
export type HpRange = [number, number];
export type HideStaleChannels = boolean;
export type ShowTimestamp = boolean;

export interface SortFieldOption {
	value: SortField;
	label: string;
}

export interface SortDirectionOption {
	value: SortDirection;
	label: string;
}

// Tools & Resources Types
export interface ToolCard {
	title: string;
	description: string;
	author?: string;
	badge?: string;
	badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
	driver?: 'npcap' | 'windivert' | 'both';
	tags?: string;
	previewImage?: string;
	url: string;
}

export interface ToolsSection {
	title: string;
	shortTitle: string;
	subtitle?: string;
	cards: ToolCard[];
}

export type ToolsSections = Record<string, ToolsSection>;
