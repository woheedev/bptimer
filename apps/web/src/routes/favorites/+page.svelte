<script lang="ts">
	import MobContainer from '$lib/components/mob/container.svelte';
	import NavigationHeader from '$lib/components/navigation/header.svelte';
	import NavigationSidebar from '$lib/components/navigation/sidebar.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { getMobsByIds } from '$lib/db/get-mobs';
	import { favoriteMobsStore } from '$lib/stores/favorite-mobs.svelte';
	import type { MobWithChannels } from '$lib/types/runtime';

	let mobs_data: MobContainer | undefined = $state();
	let favoritedMobs: MobWithChannels[] = $state([]);

	$effect(() => {
		const ids = Array.from(favoriteMobsStore.favoriteMobs);
		if (ids.length > 0) {
			getMobsByIds(ids).then((result) => {
				if ('data' in result) {
					favoritedMobs = result.data;
				} else {
					console.error('Failed to fetch favorited mobs:', result.error);
					favoritedMobs = [];
				}
			});
		} else {
			favoritedMobs = [];
		}
	});
</script>

<svelte:boundary>
	<Sidebar.Provider>
		<NavigationSidebar />
		<Sidebar.Inset>
			<NavigationHeader search={mobs_data?.search} />
			<MobContainer bind:this={mobs_data} mobs={favoritedMobs} />
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
