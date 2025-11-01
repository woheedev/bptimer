<script lang="ts">
	import { page } from '$app/state';
	import MobContainer from '$lib/components/mob/container.svelte';
	import NavigationHeader from '$lib/components/navigation/header.svelte';
	import NavigationSidebar from '$lib/components/navigation/sidebar.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { favoriteMobsStore } from '$lib/stores/favorite-mobs.svelte';

	let mobs_data: MobContainer | undefined = $state();
	const mobIds = $derived(Array.from(favoriteMobsStore.favoriteMobs));
	const canonicalUrl = `https://bptimer.com${page.url.pathname}`;
</script>

<svelte:head>
	<title>Favorites | BP Timer</title>
	<meta
		name="description"
		content="Track your favorite bosses and magical creatures in Blue Protocol: Star Resonance. Personalized tracking for the mobs you care about most."
	/>
	<meta
		name="keywords"
		content="blue protocol favorites, boss favorites, creature favorites, personalized tracker, BPSR custom tracker"
	/>
	<meta name="robots" content="noindex, follow" />

	<meta property="og:title" content="Favorites | BP Timer" />
	<meta
		property="og:description"
		content="Track your favorite bosses and magical creatures in Blue Protocol: Star Resonance. Personalized tracking for the mobs you care about most."
	/>
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />

	<meta name="twitter:title" content="Favorites | BP Timer" />
	<meta
		name="twitter:description"
		content="Track your favorite bosses and magical creatures in Blue Protocol: Star Resonance. Personalized tracking for the mobs you care about most."
	/>

	<link rel="canonical" href={canonicalUrl} />
</svelte:head>

<svelte:boundary>
	<Sidebar.Provider>
		<NavigationSidebar />
		<Sidebar.Inset>
			<NavigationHeader search={mobs_data?.search} />
			<MobContainer bind:this={mobs_data} {mobIds} />
		</Sidebar.Inset>
	</Sidebar.Provider>

	{#snippet failed(error, reset)}
		<div class="flex min-h-screen items-center justify-center p-4">
			<div class="text-center">
				<h1 class="text-destructive mb-4 text-2xl font-bold">Something went wrong</h1>
				<p class="text-muted-foreground mb-4">
					{error instanceof Error ? error.message : 'An unexpected error occurred'}
				</p>
				<Button onclick={reset}>Try again</Button>
			</div>
		</div>
	{/snippet}
</svelte:boundary>
