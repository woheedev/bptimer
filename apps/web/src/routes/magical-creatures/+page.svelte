<script lang="ts">
	import { page } from '$app/state';
	import ErrorBoundary from '$lib/components/error-boundary.svelte';
	import MobContainer from '$lib/components/mob/container.svelte';
	import NavigationHeader from '$lib/components/navigation/header.svelte';
	import NavigationSidebar from '$lib/components/navigation/sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let mobs_data: MobContainer;

	const canonicalUrl = `https://bptimer.com${page.url.pathname}`;
</script>

<svelte:head>
	<title>Magical Creatures Tracker | BP Timer</title>
	<meta
		name="description"
		content="Track rare magical creature spawns in Blue Protocol: Star Resonance. Find Loyal Boarlet, Golden Nappo, Silver Nappo, and more. Real-time spawn tracking with community data."
	/>
	<meta
		name="keywords"
		content="blue protocol magical creatures, breezy boarlet, golden nappo, silver nappo, lovely boarlet, loyal boarlet, rare creature tracker, BPSR creatures"
	/>

	<meta property="og:title" content="Magical Creatures Tracker | BP Timer" />
	<meta
		property="og:description"
		content="Track rare magical creature spawns in Blue Protocol: Star Resonance. Find Loyal Boarlet, Golden Nappo, Silver Nappo, and more."
	/>
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />

	<meta name="twitter:title" content="Magical Creatures Tracker | BP Timer" />
	<meta
		name="twitter:description"
		content="Track rare magical creature spawns in Blue Protocol: Star Resonance. Find Loyal Boarlet, Golden Nappo, Silver Nappo, and more."
	/>

	<link rel="canonical" href={canonicalUrl} />
</svelte:head>

<svelte:boundary>
	<Sidebar.Provider>
		<NavigationSidebar />
		<Sidebar.Inset>
			<NavigationHeader search={mobs_data?.search} />
			<MobContainer bind:this={mobs_data} type="magical_creature" />
		</Sidebar.Inset>
	</Sidebar.Provider>

	{#snippet failed(error, reset)}
		<ErrorBoundary {error} {reset} />
	{/snippet}
</svelte:boundary>
