<script lang="ts">
	import { page } from '$app/state';
	import ErrorBoundary from '$lib/components/error-boundary.svelte';
	import MobContainer from '$lib/components/mob/container.svelte';
	import NavigationHeader from '$lib/components/navigation/header.svelte';
	import NavigationSidebar from '$lib/components/navigation/sidebar.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { favoriteMobsStore } from '$lib/stores/favorite-mobs.svelte';

	let mobs_data: MobContainer | undefined = $state();
	const mobIds = $derived(Array.from(favoriteMobsStore.favoriteMobs));
	const canonicalUrl = `https://bptimer.com${page.url.pathname}`;
</script>

<SeoHead
	title="Favorites | BP Timer"
	description="Track your favorite bosses and magical creatures in Blue Protocol: Star Resonance. Personalized tracking for the mobs you care about most."
	keywords="blue protocol favorites, boss favorites, creature favorites, personalized tracker, BPSR custom tracker"
	{canonicalUrl}
/>

<svelte:boundary>
	<Sidebar.Provider>
		<NavigationSidebar />
		<Sidebar.Inset>
			<NavigationHeader search={mobs_data?.search} />
			<MobContainer bind:this={mobs_data} {mobIds} />
		</Sidebar.Inset>
	</Sidebar.Provider>

	{#snippet failed(error, reset)}
		<ErrorBoundary {error} {reset} />
	{/snippet}
</svelte:boundary>
