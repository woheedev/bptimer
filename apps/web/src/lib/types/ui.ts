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
