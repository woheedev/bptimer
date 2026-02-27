<script lang="ts">
	import { browser } from '$app/environment';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
	import MobCard from '$lib/components/mob/card.svelte';
	import MobModal from '$lib/components/mob/modal.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Empty } from '$lib/components/ui/empty';
	import {
		DEBOUNCE_DELAY,
		LATEST_CHANNELS_DISPLAY_COUNT,
		STALE_DATA_CHECK_INTERVAL
	} from '$lib/constants';
	import { realtimeMobsStore } from '$lib/stores/realtime-mobs.svelte';
	import { regionStore } from '$lib/stores/region.svelte';
	import type { MobWithChannels } from '$lib/types/mobs';
	import { loadMobsData } from '$lib/utils/mob-filtering';
	import { updateLatestChannels } from '$lib/utils/mob-utils';
	import { createDebouncedSearch, filterMobsByName } from '$lib/utils/search.svelte';

	let {
		type = 'boss',
		searchQuery = $bindable(''),
		mobIds = $bindable()
	}: {
		type?: 'boss' | 'magical_creature';
		searchQuery?: string;
		mobIds?: string[];
	} = $props();

	let mobs = $state<MobWithChannels[]>([]);
	let selectedMob = $state<{
		id: string;
		name: string;
		uid: number;
		type: 'boss' | 'magical_creature';
		icon_name?: string;
		total_channels: number;
		channels: Array<{
			channel: number;
			status: 'alive' | 'dead' | 'unknown';
			hp_percentage: number;
		}>;
		reports: Array<{
			id: string;
			channel: number;
			hp_percentage: number;
			user: {
				id: string;
				name: string;
				avatar?: string;
			};
			create_time: string;
		}>;
	} | null>(null);
	let modalOpen = $state(false);
	let selectedChannel = $state<number | null>(null);
	let loading = $state(true);

	// Filtered mobs based on search query
	const filteredMobs = $derived(filterMobsByName(mobs, searchQuery));

	// Responsive ad interval
	let gridCols = $state(4);
	$effect(() => {
		if (!browser) return;
		const queries = [
			{ mq: window.matchMedia('(min-width: 1280px)'), cols: 4 },
			{ mq: window.matchMedia('(min-width: 1024px)'), cols: 3 },
			{ mq: window.matchMedia('(min-width: 768px)'), cols: 2 }
		];
		function update() {
			gridCols = queries.find((q) => q.mq.matches)?.cols ?? 1;
		}
		update();
		for (const q of queries) q.mq.addEventListener('change', update);
		return () => {
			for (const q of queries) q.mq.removeEventListener('change', update);
		};
	});
	const adSlotInterval = $derived(gridCols === 1 ? 3 : gridCols * 2);

	const mobChunks = $derived.by(() => {
		const chunks: MobWithChannels[][] = [];
		for (let i = 0; i < filteredMobs.length; i += adSlotInterval) {
			chunks.push(filteredMobs.slice(i, i + adSlotInterval));
		}
		return chunks;
	});

	// Get live channels for the selected mob (updated via SSE)
	const liveChannels = $derived.by(() => {
		if (!selectedMob) return [];
		const mob = mobs.find((m) => m.id === selectedMob!.id);
		return mob?.latestChannels || [];
	});

	// Create debounced search function
	export const search = createDebouncedSearch((query) => {
		searchQuery = query;
	}, DEBOUNCE_DELAY);

	// Get singular and plural names based on type
	const isFavorites = $derived(mobIds !== undefined);
	const singularName = $derived(isFavorites ? 'mob' : type === 'boss' ? 'boss' : 'creature');
	const pluralName = $derived(isFavorites ? 'mobs' : type === 'boss' ? 'bosses' : 'creatures');

	async function loadMobs() {
		try {
			const response = await loadMobsData(type, regionStore.value, mobIds);
			mobs = response.data;
		} catch (error) {
			console.error(`Error fetching ${pluralName}:`, error);
		}
	}

	// Load mobs when type, region, or mobIds change
	$effect(() => {
		if (!browser) return;
		loading = true;
		loadMobs().then(() => {
			loading = false;
		});
	});

	// Realtime subscription
	$effect(() => {
		const cleanup = realtimeMobsStore.subscribeToMobs((events) => {
			if (events && events.length > 0) {
				// Process all events at once (batched)
				let updatedMobs = mobs;
				for (const eventData of events) {
					updatedMobs = realtimeMobsStore.handleRealtimeUpdate(updatedMobs, eventData);
				}
				// Single state update after processing all events
				mobs = updatedMobs;
			} else {
				// Fallback to HTTP request if no event data
				loadMobs();
			}
		}, regionStore.value);
		return cleanup;
	});

	// Periodic stale data cleanup for realtime
	$effect(() => {
		const interval = setInterval(() => {
			mobs = realtimeMobsStore.filterStaleChannels(mobs);
		}, STALE_DATA_CHECK_INTERVAL);

		return () => clearInterval(interval);
	});

	function handleViewDetails(
		mobId: string,
		mobName: string,
		mobUid: number,
		totalChannels: number,
		channel?: number
	) {
		const mob = mobs.find((m) => m.id === mobId);
		const mobType = mob?.type || type; // Fallback to container type

		selectedMob = {
			id: mobId,
			name: mobName,
			uid: mobUid,
			type: mobType,
			total_channels: totalChannels,
			channels: mob?.latestChannels || [], // Pass SSE-updated channels to modal
			reports: []
		};
		selectedChannel = channel || null;
		modalOpen = true;
	}

	function handleCloseModal() {
		modalOpen = false;
		selectedMob = null;
		selectedChannel = null;
	}

	function handleReportSubmitted(data: { mobId: string; channel: number; hp_percentage: number }) {
		const { mobId, channel, hp_percentage } = data;

		// Find the mob in the mobs array
		const mobIndex = mobs.findIndex((m) => m.id === mobId);
		if (mobIndex === -1) return;

		const mob = mobs[mobIndex];
		const updatedChannels = updateLatestChannels(mob.latestChannels || [], channel, hp_percentage);

		// Update the mob in the array with new references
		mobs[mobIndex] = {
			...mob,
			latestChannels: updatedChannels
		};

		// Trigger reactivity by reassigning the array
		mobs = [...mobs];
	}
</script>

<div class="flex flex-1 flex-col">
	<div class="@container/main flex flex-col gap-2">
		<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
			<!-- Search result count -->
			{#if searchQuery && !loading}
				<div class="px-4 lg:px-6">
					<p class="text-sm text-muted-foreground">
						Found {filteredMobs.length}
						{filteredMobs.length === 1 ? singularName : pluralName}
						{#if searchQuery}
							matching "{searchQuery}"
						{/if}
					</p>
				</div>
			{/if}

			{#if loading}
				<LoadingSpinner />
			{:else if isFavorites && filteredMobs.length === 0}
				<!-- Empty state for no favorites -->
				<Empty class="min-h-96">
					<p class="mb-2 text-lg text-muted-foreground">No favorite mobs yet</p>
					<p class="text-sm text-muted-foreground">
						Click the heart icon on mob cards to add favorites
					</p>
				</Empty>
			{:else if filteredMobs.length === 0 && searchQuery}
				<!-- Empty state for no search results -->
				<Empty class="min-h-96">
					<p class="mb-2 text-lg text-muted-foreground">
						No {pluralName} found for "{searchQuery}"
					</p>
					<Button onclick={() => (searchQuery = '')} variant="outline" size="sm"
						>Clear search</Button
					>
				</Empty>
			{:else}
				{#each mobChunks as chunk, chunkIndex (chunkIndex)}
					{#if chunkIndex > 0}
						<div class="pb-ic flex w-full justify-center border-y p-1"></div>
					{/if}
					<div
						class="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3 lg:px-6 xl:grid-cols-4"
					>
						{#each chunk as mob (mob.id)}
							<MobCard
								{mob}
								latestChannels={(mob.latestChannels || []).slice(0, LATEST_CHANNELS_DISPLAY_COUNT)}
								onViewDetails={handleViewDetails}
								onChannelClick={handleViewDetails}
								type={isFavorites ? mob.type : type}
								region={regionStore.value}
							/>
						{/each}
					</div>
				{/each}
			{/if}
		</div>

		{#key selectedMob?.id}
			{#if selectedMob}
				<MobModal
					open={modalOpen}
					mobId={selectedMob.id}
					mobName={selectedMob.name}
					totalChannels={selectedMob.total_channels}
					{liveChannels}
					onClose={handleCloseModal}
					onReportSubmitted={handleReportSubmitted}
					type={selectedMob.type}
					initialSelectedChannel={selectedChannel}
				/>
			{/if}
		{/key}
	</div>
</div>
