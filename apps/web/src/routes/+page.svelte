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
	<title>Boss Spawn Tracker | BP Timer</title>
	<meta
		name="description"
		content="Real-time boss spawn tracking for Blue Protocol: Star Resonance. Track all field bosses including Muku King, Goblin King, Tempest Ogre, and more. Community-driven data powered by winj's DPS Meter."
	/>
	<meta
		name="keywords"
		content="blue protocol boss tracker, BPSR boss timer, field boss spawns, muku king timer, goblin king timer, tempest ogre tracker, blue protocol events"
	/>

	<meta property="og:title" content="Boss Spawn Tracker | BP Timer" />
	<meta
		property="og:description"
		content="Real-time boss spawn tracking for Blue Protocol: Star Resonance. Track all field bosses including Muku King, Goblin King, Tempest Ogre, and more."
	/>
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />

	<meta name="twitter:title" content="Boss Spawn Tracker | BP Timer" />
	<meta
		name="twitter:description"
		content="Real-time boss spawn tracking for Blue Protocol: Star Resonance. Track all field bosses including Muku King, Goblin King, Tempest Ogre, and more."
	/>

	<link rel="canonical" href={canonicalUrl} />
</svelte:head>

<svelte:boundary>
	<Sidebar.Provider>
		<NavigationSidebar />
		<Sidebar.Inset>
			<NavigationHeader search={mobs_data?.search} />
			<MobContainer bind:this={mobs_data} type="boss" />
		</Sidebar.Inset>
	</Sidebar.Provider>

	{#snippet failed(error, reset)}
		<ErrorBoundary {error} {reset} />
	{/snippet}
</svelte:boundary>
