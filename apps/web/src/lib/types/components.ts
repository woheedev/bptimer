import type { Component } from 'svelte';

// Page Header Component Props
export interface PageHeaderProps {
	icon: Component;
	title: string;
	subtitle?: string;
}

// SEO Head Component Props
export interface SeoHeadProps {
	title: string;
	description: string;
	keywords?: string;
	canonicalUrl: string;
	ogType?: string;
}
