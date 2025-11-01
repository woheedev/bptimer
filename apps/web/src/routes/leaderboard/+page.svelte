<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { TrophyIcon } from '@lucide/svelte/icons';
	import NavigationHeader from '$lib/components/navigation/header.svelte';
	import NavigationSidebar from '$lib/components/navigation/sidebar.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import {
		LEADERBOARD_LIMIT,
		REPUTATION_GOOD_THRESHOLD,
		REPUTATION_HIGH_THRESHOLD,
		REPUTATION_MEDIUM_THRESHOLD
	} from '$lib/constants';
	import { getLeaderboard } from '$lib/db/get-leaderboard';
	import type { LeaderboardEntry } from '$lib/schemas';
	import { getInitials } from '$lib/utils/general-utils';
	import { getAvatarUrl } from '$lib/utils/user-utils';
	import { Spinner } from '$lib/components/ui/spinner';

	let leaderboard = $state<LeaderboardEntry[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	const canonicalUrl = `https://bptimer.com${page.url.pathname}`;

	$effect(() => {
		if (browser) {
			getLeaderboard(LEADERBOARD_LIMIT).then((result) => {
				if ('error' in result) {
					error = result.error;
				} else {
					leaderboard = result.data;
				}
				isLoading = false;
			});
		}
	});

	function getRankColor(rank: number): string {
		if (rank === 1) return 'text-yellow-500';
		if (rank === 2) return 'text-gray-400';
		if (rank === 3) return 'text-amber-600';
		return 'text-muted-foreground';
	}

	function getReputationColorClass(reputation: number): string {
		if (reputation >= REPUTATION_HIGH_THRESHOLD) return 'text-green-600';
		if (reputation >= REPUTATION_MEDIUM_THRESHOLD) return 'text-yellow-600';
		return '';
	}

	function getReputationBorderClass(reputation: number): string {
		return reputation >= REPUTATION_GOOD_THRESHOLD ? 'border-green-500/60' : 'border-border';
	}
</script>

<svelte:head>
	<title>Leaderboard | BP Timer</title>
	<meta
		name="description"
		content="Top contributors to the Blue Protocol boss tracking community ranked by reputation. See who's helping the community track boss spawns and magical creatures in BPSR."
	/>
	<meta
		name="keywords"
		content="blue protocol leaderboard, BPSR contributors, boss tracker reputation, community rankings, top trackers"
	/>

	<meta property="og:title" content="Leaderboard | BP Timer" />
	<meta
		property="og:description"
		content="Top contributors to the Blue Protocol boss tracking community ranked by reputation. See who's helping the community track boss spawns."
	/>
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />

	<meta name="twitter:title" content="Leaderboard | BP Timer" />
	<meta
		name="twitter:description"
		content="Top contributors to the Blue Protocol boss tracking community ranked by reputation."
	/>

	<link rel="canonical" href={canonicalUrl} />
</svelte:head>

<svelte:boundary>
	<Sidebar.Provider>
		<NavigationSidebar />
		<Sidebar.Inset>
			<NavigationHeader />
			<div class="container mx-auto space-y-6 p-4">
				<div class="flex items-center gap-3">
					<TrophyIcon class="h-8 w-8" />
					<div>
						<h1 class="text-3xl font-bold">Leaderboard</h1>
						<p class="text-muted-foreground">Top contributors ranked by reputation</p>
					</div>
				</div>

				{#if isLoading}
					<div class="flex h-screen items-center justify-center">
						<Spinner class="size-16" />
					</div>
				{:else if error}
					<div class="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950">
						<p class="text-red-700 dark:text-red-300">Error loading leaderboard: {error}</p>
					</div>
				{:else if leaderboard.length === 0}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">No data available yet.</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each leaderboard as entry, index (entry.id)}
							{@const rank = index + 1}
							{@const userInitials = getInitials(entry.username)}
							{@const avatarUrl = getAvatarUrl({
								id: entry.id,
								avatar: entry.avatar,
								collectionName: 'users'
							})}
							{@const reputation = entry.reputation ?? 0}
							{@const hasGoodReputation = reputation >= REPUTATION_GOOD_THRESHOLD}
							<div
								class="relative flex items-center gap-4 rounded-lg border p-4 transition-colors {getReputationBorderClass(
									reputation
								)}"
							>
								<!-- Gradient overlay -->
								{#if hasGoodReputation}
									<div
										class="pointer-events-none absolute inset-0 rounded-lg"
										style="background: linear-gradient(139deg, #22c55e44, #22c59800);"
									></div>
								{/if}
								<!-- Rank -->
								<div class="relative flex w-16 shrink-0 items-center gap-2">
									{#if rank <= 3}
										<TrophyIcon class="h-6 w-6 {getRankColor(rank)}" />
									{/if}
									<span class="text-lg font-bold {getRankColor(rank)}">#{rank}</span>
								</div>

								<!-- User Info -->
								<div class="relative flex min-w-0 flex-1 items-center gap-3">
									<Avatar.Root class="h-12 w-12 shrink-0">
										<Avatar.Image src={avatarUrl} alt={entry.username} />
										<Avatar.Fallback>{userInitials}</Avatar.Fallback>
									</Avatar.Root>
									<div class="min-w-0 flex-1">
										<div class="truncate font-semibold">{entry.username}</div>
									</div>
								</div>

								<!-- Stats -->
								<div class="relative flex shrink-0 text-sm">
									<div class="text-center">
										<div class="text-muted-foreground text-xs">Reputation</div>
										<div class="font-semibold {getReputationColorClass(reputation)}">
											{reputation}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
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
