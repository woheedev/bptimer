<script lang="ts">
	import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import { getContext } from 'svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import {
		API_USERS,
		REPUTATION_BAD_DISPLAY_THRESHOLD,
		BYPASS_VOTE_USER_IDS,
		REPUTATION_GOOD_THRESHOLD,
		SECOND,
		VOTE_TIME_WINDOW
	} from '$lib/constants';
	import { createVote } from '$lib/db/create-vote';
	import { deleteVote } from '$lib/db/delete-vote';
	import { pb } from '$lib/pocketbase';
	import type { MobReport } from '$lib/types/db';
	import type { UserRecordModel } from '$lib/types/auth';
	import { formatTimeAgo, getInitials } from '$lib/utils/general-utils';
	import { showToast } from '$lib/utils/toast';

	let {
		report,
		reporterReputation = 0
	}: {
		report: MobReport;
		reporterReputation?: number;
	} = $props();

	// Get current user from context
	const getUser = getContext<() => UserRecordModel | null>('user');
	const currentUser = $derived(getUser());

	// Get user initials for avatar fallback
	const user_initials = $derived(getInitials(report.user.name));

	// Special user configuration
	const isSpecialUser = $derived(BYPASS_VOTE_USER_IDS.includes(report.user.id));
	const displayName = $derived(API_USERS[report.user.id] ?? report.user.name);

	// Reactive time for live updates
	let now = $state(Date.now());

	$effect(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, SECOND);
		return () => clearInterval(interval);
	});

	// Check if voting window expired
	const votingExpired = $derived.by(() => {
		const reportTime = new Date(report.create_time).getTime();
		const timeSinceReport = now - reportTime;
		return timeSinceReport > VOTE_TIME_WINDOW;
	});

	// User's current vote
	let userVote = $state<{ id: string; vote_type: 'up' | 'down' } | null>(null);
	let isVoting = $state(false);

	// Local vote counts for optimistic updates
	let localUpvotes = $state(report.upvotes);
	let localDownvotes = $state(report.downvotes);

	// Sync local counts when report prop changes
	$effect(() => {
		if (!isVoting) {
			localUpvotes = report.upvotes;
			localDownvotes = report.downvotes;
		}
	});

	// Vote button disabled state
	const isVoteDisabled = $derived(
		isVoting || report.reporter_id === currentUser?.id || !currentUser
	);

	// Vote button hover enabled state
	const canHoverVote = $derived(currentUser !== null && report.reporter_id !== currentUser.id);

	// Fetch user's vote on this report
	async function fetchUserVote() {
		if (!currentUser) return;
		try {
			const vote = await pb
				.collection('votes')
				.getFirstListItem(`report = "${report.id}" && voter = "${currentUser.id}"`);
			userVote = { id: vote.id, vote_type: vote.vote_type };
		} catch {
			userVote = null;
		}
	}

	// Handle vote action
	async function handleVote(voteType: 'up' | 'down') {
		if (!currentUser) {
			return;
		}

		if (isVoting) return;

		isVoting = true;

		try {
			if (userVote?.vote_type === voteType) {
				// Remove vote
				await deleteVote(userVote.id);
				userVote = null;
				if (voteType === 'up') {
					localUpvotes--;
				} else {
					localDownvotes--;
				}
			} else {
				// Create or update vote
				const voteId = await createVote(report.id, voteType);

				// Update local state
				if (userVote) {
					if (userVote.vote_type === 'up') {
						localUpvotes--;
					} else {
						localDownvotes--;
					}
				}
				if (voteType === 'up') {
					localUpvotes++;
				} else {
					localDownvotes++;
				}

				userVote = { id: voteId, vote_type: voteType };
			}
		} catch (error) {
			console.error('Error voting:', error);
			const errorMsg = error instanceof Error ? error.message : 'Failed to submit vote';
			showToast.error(errorMsg);
			// Revert optimistic update
			await fetchUserVote();
			localUpvotes = report.upvotes;
			localDownvotes = report.downvotes;
		} finally {
			isVoting = false;
		}
	}

	// Check rep
	const hasGoodReputation = $derived(reporterReputation >= REPUTATION_GOOD_THRESHOLD);
	const isUntrustworthy = $derived(reporterReputation <= REPUTATION_BAD_DISPLAY_THRESHOLD);

	// Border class for reputation
	const borderClass = $derived(
		hasGoodReputation
			? 'border-green-500/60'
			: isUntrustworthy
				? 'border-red-900/60'
				: 'border-border'
	);

	// Fetch user's vote when component mounts
	$effect(() => {
		if (currentUser) {
			fetchUserVote();
		}
	});
</script>

<div class="relative shrink-0 rounded-lg border p-3 {borderClass}">
	<!-- Gradient overlay for good reputation -->
	{#if hasGoodReputation}
		<div
			class="pointer-events-none absolute inset-0 rounded-lg"
			style="background: linear-gradient(139deg, #22c55e44, #22c59800);"
		></div>
	{/if}
	<!-- Gradient overlay for untrustworthy users -->
	{#if isUntrustworthy && !hasGoodReputation}
		<div
			class="pointer-events-none absolute inset-0 rounded-lg"
			style="background: linear-gradient(139deg, #991b1b44, #7f1d1d00);"
		></div>
	{/if}
	<div class="relative flex items-start justify-between gap-2">
		<!-- Left side: Avatar + Info -->
		<div class="flex min-w-0 flex-1 items-center space-x-2">
			<Avatar.Root class="h-8 w-8 shrink-0">
				{#if !isSpecialUser}
					<Avatar.Image src={report.user.avatar} alt={report.user.name} />
				{/if}
				<Avatar.Fallback class="text-sm">
					{user_initials}
				</Avatar.Fallback>
			</Avatar.Root>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-medium">
					Line {report.channel} • {report.hp_percentage}% HP
				</p>
				<p class="truncate text-xs">{displayName}</p>
			</div>
		</div>

		<!-- Right side: Vote buttons -->
		<div class="flex shrink-0 items-center gap-1">
			{#if BYPASS_VOTE_USER_IDS.includes(report.reporter_id)}
				<span class="text-muted-foreground text-xs">API report</span>
			{:else if votingExpired}
				<span class="text-muted-foreground text-xs">Voting closed</span>
			{:else}
				<button
					class="flex items-center gap-1 rounded-md px-2 py-1 transition-colors disabled:opacity-50"
					class:text-green-600={userVote?.vote_type === 'up'}
					class:font-semibold={userVote?.vote_type === 'up'}
					class:hover:text-green-500={userVote?.vote_type !== 'up' && canHoverVote}
					aria-label="Upvote"
					disabled={isVoteDisabled}
					onclick={() => handleVote('up')}
				>
					<ThumbsUpIcon class="h-4 w-4" />
					<span class="text-xs">{localUpvotes}</span>
				</button>
				<button
					class="flex items-center gap-1 rounded-md px-2 py-1 transition-colors disabled:opacity-50"
					class:text-red-600={userVote?.vote_type === 'down'}
					class:font-semibold={userVote?.vote_type === 'down'}
					class:hover:text-red-500={userVote?.vote_type !== 'down' && canHoverVote}
					aria-label="Downvote"
					disabled={isVoteDisabled}
					onclick={() => handleVote('down')}
				>
					<ThumbsDownIcon class="h-4 w-4" />
					<span class="text-xs">{localDownvotes}</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Bottom: Timestamp -->
	<div class="absolute right-2 bottom-2">
		<p class="text-muted-foreground text-xs">
			{formatTimeAgo(report.create_time, new Date(now))}
		</p>
	</div>
</div>
