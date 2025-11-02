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
};

// Filter and Sort Types
export type SortField = 'channel' | 'hp' | 'report_time';
export type SortDirection = 'ascending' | 'descending';
export type HpRange = [number, number];
export type HideStaleChannels = boolean;

export interface SortFieldOption {
	value: SortField;
	label: string;
}

export interface SortDirectionOption {
	value: SortDirection;
	label: string;
}
