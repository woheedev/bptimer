<script lang="ts">
	import type { SeoHeadProps } from '$lib/types/components';

	let { title, description, keywords, canonicalUrl, ogType = 'website' }: SeoHeadProps = $props();
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if keywords}
		<meta name="keywords" content={keywords} />
	{/if}

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content={ogType} />

	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />

	<link rel="canonical" href={canonicalUrl} />
</svelte:head>
