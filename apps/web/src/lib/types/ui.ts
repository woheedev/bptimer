// UI Component Types
import type { Component } from 'svelte';

export type PageItem = {
	title: string;
	url: string;
	icon?: Component;
	comingSoon?: boolean;
	external?: boolean;
	variant?: 'default' | 'outline' | 'primary';
};

// Filter and Sort Types
export type SortField = 'channel' | 'hp';
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

export type FilterSortSettings = {
	sortField: SortField;
	sortDirection: SortDirection;
	hpRange: HpRange;
	hideStaleChannels: HideStaleChannels;
};
