<script lang="ts">
	import MobCard from '$lib/components/mob/card.svelte';
	import MobModal from '$lib/components/mob/modal.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Empty } from '$lib/components/ui/empty';
	import { Spinner } from '$lib/components/ui/spinner';
	import {
		DEBOUNCE_DELAY,
		LATEST_CHANNELS_DISPLAY_COUNT,
		STALE_DATA_CHECK_INTERVAL
	} from '$lib/constants';
	import { realtimeMobsStore } from '$lib/stores/realtime-mobs.svelte';
	import type { MobWithChannels } from '$lib/types/mobs';
	import { loadMobsData } from '$lib/utils/mob-filtering';
	import { updateLatestChannels } from '$lib/utils/mob-utils';
	import { browser } from '$app/environment';
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
			const response = await loadMobsData(type, mobIds);
			mobs = response.data;
		} catch (error) {
			console.error(`Error fetching ${pluralName}:`, error);
		}
	}

	// Initial load on mount
	$effect(() => {
		if (!browser) return;
		if (mobIds === undefined) {
			loadMobs().then(() => {
				loading = false;
			});
		}
	});

	$effect(() => {
		// Handle favorites loading when mobIds changes
		if (mobIds !== undefined) {
			loading = true;
			loadMobs().then(() => {
				loading = false;
			});
		}
	});

	// Realtime subscription
	$effect(() => {
		const cleanup = realtimeMobsStore.subscribeToMobs((events) => {
			if (events && events.length > 0) {
				// Process all events at once (batched)
				let updatedMobs = mobs;
				for (const eventData of events) {
					updatedMobs = realtimeMobsStore.handleRealtimeUpdate(
						updatedMobs,
						eventData,
						type,
						mobIds
					);
				}
				// Single state update after processing all events
				mobs = updatedMobs;
			} else {
				// Fallback to HTTP request if no event data
				loadMobs();
			}
		});
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
					<p class="text-muted-foreground text-sm">
						Found {filteredMobs.length}
						{filteredMobs.length === 1 ? singularName : pluralName}
						{#if searchQuery}
							matching "{searchQuery}"
						{/if}
					</p>
				</div>
			{/if}

			{#if loading}
				<div class="flex h-screen items-center justify-center">
					<Spinner class="size-16" />
				</div>
			{:else if isFavorites && filteredMobs.length === 0}
				<!-- Empty state for no favorites -->
				<Empty class="min-h-96">
					<p class="text-muted-foreground mb-2 text-lg">No favorite mobs yet</p>
					<p class="text-muted-foreground text-sm">
						Click the heart icon on mob cards to add favorites
					</p>
				</Empty>
			{:else if filteredMobs.length === 0 && searchQuery}
				<!-- Empty state for no search results -->
				<Empty class="min-h-96">
					<p class="text-muted-foreground mb-2 text-lg">
						No {pluralName} found for "{searchQuery}"
					</p>
					<Button onclick={() => (searchQuery = '')} variant="outline" size="sm"
						>Clear search</Button
					>
				</Empty>
			{:else}
				<div
					class="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3 lg:px-6 xl:grid-cols-4"
				>
					{#each filteredMobs as mob (mob.id)}
						<MobCard
							{mob}
							latestChannels={(mob.latestChannels || []).slice(0, LATEST_CHANNELS_DISPLAY_COUNT)}
							onViewDetails={handleViewDetails}
							onChannelClick={handleViewDetails}
							type={isFavorites ? mob.type : type}
						/>
					{/each}
				</div>
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
