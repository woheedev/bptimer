<script lang="ts">
	import MobCard from '$lib/components/mob/card.svelte';
	import MobModal from '$lib/components/mob/modal.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Empty } from '$lib/components/ui/empty';
	import { Spinner } from '$lib/components/ui/spinner';
	import { AUTO_REFRESH_INTERVAL, DEBOUNCE_DELAY } from '$lib/constants';
	import { getBosses, getMagicalCreatures, getMobsByIds } from '$lib/db/get-mobs';
	import { autoRefreshStore } from '$lib/stores/auto-refresh.svelte';
	import type { MobWithChannels } from '$lib/types/mobs';
	import { updateLatestChannels } from '$lib/utils/mob-utils';
	import { createDebouncedSearch, filterMobsByName } from '$lib/utils/search.svelte';
	import { onMount } from 'svelte';

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
		icon_name?: string;
		total_channels: number;
		channels: Array<{
			channel: number;
			status: 'alive' | 'dead' | 'unknown';
			hp_percentage: number;
			report_count: number;
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
	let filteredMobs = $derived(filterMobsByName(mobs, searchQuery));

	// Create debounced search function
	export const search = createDebouncedSearch((query) => {
		searchQuery = query;
	}, DEBOUNCE_DELAY);

	// Get singular and plural names based on type
	let isFavorites = $derived(mobIds !== undefined);
	let singularName = $derived(isFavorites ? 'mob' : type === 'boss' ? 'boss' : 'creature');
	let pluralName = $derived(isFavorites ? 'mobs' : type === 'boss' ? 'bosses' : 'creatures');

	async function loadMobs() {
		try {
			let response;
			if (mobIds !== undefined) {
				response = await getMobsByIds(mobIds);
			} else if (type === 'boss') {
				response = await getBosses();
			} else {
				response = await getMagicalCreatures();
			}

			if ('data' in response) {
				mobs = response.data;
			} else {
				console.error(`Failed to fetch ${pluralName}:`, response.error);
			}
		} catch (error) {
			console.error(`Error fetching ${pluralName}:`, error);
		}
	}

	onMount(async () => {
		if (mobIds === undefined) {
			await loadMobs();
			loading = false;
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

	// Auto-refresh logic
	$effect(() => {
		if (autoRefreshStore.enabled) {
			const interval = setInterval(() => {
				loadMobs();
			}, AUTO_REFRESH_INTERVAL);
			return () => clearInterval(interval);
		}
	});

	function handleViewDetails(
		mobId: string,
		mobName: string,
		mobUid: number,
		totalChannels: number,
		channel?: number
	) {
		selectedMob = {
			id: mobId,
			name: mobName,
			uid: mobUid,
			total_channels: totalChannels,
			channels: [],
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
				<div class="flex min-h-screen flex-col items-center justify-center space-y-4">
					<Spinner class="size-8" />
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
					class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-3 lg:px-6 xl:grid-cols-4"
				>
					{#each filteredMobs as mob (mob.id)}
						<MobCard
							{mob}
							latestChannels={mob.latestChannels || []}
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
					onClose={handleCloseModal}
					onReportSubmitted={handleReportSubmitted}
					{type}
					initialSelectedChannel={selectedChannel}
				/>
			{/if}
		{/key}
	</div>
</div>
