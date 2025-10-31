<script lang="ts">
	import ReportCard from '$lib/components/mob/report-card.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { MobReport } from '$lib/types/db';
	import type { UserVotesMap } from '$lib/types/db';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { getLocationImagePath } from '$lib/utils/mob-utils';
	import { SPECIAL_MAGICAL_CREATURE_LOCATION_COUNTS } from '$lib/constants';

	let {
		reports,
		isLoadingReports,
		selectedChannel,
		onRefresh,
		mobName,
		mobType,
		userVotesMap = new Map()
	}: {
		reports: MobReport[];
		isLoadingReports: boolean;
		selectedChannel: number | null;
		onRefresh: () => void;
		mobName: string;
		mobType: 'boss' | 'magical_creature' | string;
		userVotesMap?: UserVotesMap;
	} = $props();

	// Check if this is a special magical creature
	const isSpecialMagicalCreature = $derived(mobName in SPECIAL_MAGICAL_CREATURE_LOCATION_COUNTS);

	// Get most recent location image
	const mostRecentLocationImage = $derived(
		selectedChannel !== null &&
			isSpecialMagicalCreature &&
			reports.length > 0 &&
			reports[0].location_image
			? getLocationImagePath(mobName, mobType, reports[0].location_image)
			: null
	);
</script>

<!-- Reports Section -->
<Card.Root class="flex h-full min-h-0 flex-1 flex-col">
	<Card.Header class="flex flex-row items-center justify-between pb-2">
		<Card.Title class="text-base">
			{selectedChannel ? `Line ${selectedChannel} Reports` : 'Latest Reports'}
		</Card.Title>
		<Button
			variant="ghost"
			size="sm"
			onclick={onRefresh}
			disabled={isLoadingReports}
			class="h-8 w-8 p-0"
		>
			<RefreshCw class={`h-4 w-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
		</Button>
	</Card.Header>
	<Card.Content class="flex-1 space-y-2 overflow-y-auto p-2">
		{#if isLoadingReports}
			<div class="flex h-32 items-center justify-center">
				<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900"></div>
				<p class="text-muted-foreground ml-3 text-sm">Loading reports...</p>
			</div>
		{:else if reports.length > 0}
			{#if mostRecentLocationImage}
				<div class="mb-2 overflow-hidden rounded-md border">
					<img
						src={mostRecentLocationImage}
						alt="Most recent location"
						class="h-auto w-full max-w-full object-contain"
						onerror={(e) => {
							(e.target as HTMLImageElement).style.display = 'none';
						}}
					/>
				</div>
			{/if}
			{#each reports as report (report.id)}
				<ReportCard
					{report}
					reporterReputation={report.reporter_reputation}
					userVote={userVotesMap.get(report.id)}
				/>
			{/each}
		{:else}
			<p class="text-muted-foreground py-4 text-center text-sm">No reports yet</p>
		{/if}
	</Card.Content>
</Card.Root>
