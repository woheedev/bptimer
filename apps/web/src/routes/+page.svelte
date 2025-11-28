<script lang="ts">
	import { page } from '$app/state';
	import ErrorBoundary from '$lib/components/error-boundary.svelte';
	import MobContainer from '$lib/components/mob/container.svelte';
	import NavigationHeader from '$lib/components/navigation/header.svelte';
	import NavigationSidebar from '$lib/components/navigation/sidebar.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let mobs_data: MobContainer;

	const canonicalUrl = `https://bptimer.com${page.url.pathname}`;
</script>

<SeoHead
	title="Boss Spawn Tracker | BP Timer"
	description="Real-time boss spawn tracking for Blue Protocol: Star Resonance. Track all field bosses including Muku King, Goblin King, Tempest Ogre, and more. Community-driven data."
	keywords="blue protocol boss tracker, BPSR boss timer, field boss spawns, muku king timer, goblin king timer, tempest ogre tracker, blue protocol events"
	{canonicalUrl}
/>

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
