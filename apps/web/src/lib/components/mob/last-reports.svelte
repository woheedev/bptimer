<script lang="ts">
	import ReportCard from '$lib/components/mob/report-card.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { MobReport, UserVotesMap } from '$lib/types/db';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	let {
		reports,
		isLoadingReports,
		selectedChannel,
		onRefresh,
		userVotesMap = new Map()
	}: {
		reports: MobReport[];
		isLoadingReports: boolean;
		selectedChannel: number | null;
		onRefresh: () => void;
		userVotesMap?: UserVotesMap;
	} = $props();
</script>

<!-- Reports Section -->
<Card.Root class="flex h-full min-h-0 flex-1 flex-col gap-4">
	<Card.Header class="flex flex-row items-center justify-between">
		<Card.Title class="text-base">
			{selectedChannel ? `Line ${selectedChannel} Reports` : 'Latest Reports'}
		</Card.Title>
		<Button
			variant="outline"
			size="sm"
			onclick={onRefresh}
			disabled={isLoadingReports}
			class="h-8 w-8 p-0"
		>
			<RefreshCw class={`h-4 w-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
		</Button>
	</Card.Header>
	<Card.Content class="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
		{#if isLoadingReports}
			<div class="flex h-32 items-center justify-center">
				<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900"></div>
				<p class="ml-3 text-sm text-muted-foreground">Loading reports...</p>
			</div>
		{:else if reports.length > 0}
			{#each reports as report (report.id)}
				<ReportCard
					{report}
					reporterReputation={report.reporter_reputation}
					userVote={userVotesMap.get(report.id) ?? null}
				/>
			{/each}
		{:else}
			<p class="py-4 text-center text-sm text-muted-foreground">No reports yet</p>
		{/if}
	</Card.Content>
</Card.Root>
