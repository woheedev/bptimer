<script lang="ts">
	import ReportCard from '$lib/components/mob/report-card.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	let {
		reports,
		isLoadingReports,
		selectedChannel,
		onRefresh
	}: {
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
		isLoadingReports: boolean;
		selectedChannel: number | null;
		onRefresh: () => void;
	} = $props();
</script>

<!-- Reports Section -->
<Card.Root class="flex h-full min-h-0 flex-1 flex-col">
	<Card.Header class="flex flex-row items-center justify-between pb-2">
		<Card.Title class="text-base">
			{selectedChannel ? `Channel ${selectedChannel} Reports` : 'Latest Reports'}
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
			{#each reports as report (report.id)}
				<ReportCard {report} />
			{/each}
		{:else}
			<p class="text-muted-foreground py-4 text-center text-sm">No reports yet</p>
		{/if}
	</Card.Content>
</Card.Root>
