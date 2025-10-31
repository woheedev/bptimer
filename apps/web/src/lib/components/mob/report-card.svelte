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
	import type { UserVoteInfo } from '$lib/types/db';
	import { formatTimeAgo, getInitials } from '$lib/utils/general-utils';
	import { showToast } from '$lib/utils/toast';

	let {
		report,
		reporterReputation = 0,
		userVote: passedUserVote
	}: {
		report: MobReport;
		reporterReputation?: number;
		userVote?: UserVoteInfo | null | undefined;
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
	let user_vote = $state<UserVoteInfo | null | undefined>(passedUserVote);
	let is_voting = $state(false);

	// Sync user_vote when prop changes
	$effect(() => {
		if (passedUserVote !== undefined) {
			user_vote = passedUserVote;
		}
	});

	// Optimistic local vote counts
	let local_upvotes = $state(report.upvotes);
	let local_downvotes = $state(report.downvotes);
	let last_report_id = $state(report.id);

	// Sync counts only when report ID changes (new report) or on explicit refresh
	$effect(() => {
		if (report.id !== last_report_id) {
			last_report_id = report.id;
			local_upvotes = report.upvotes;
			local_downvotes = report.downvotes;
		} else if (passedUserVote !== undefined) {
			// Update counts to match server state
			local_upvotes = report.upvotes;
			local_downvotes = report.downvotes;
		}
	});

	// Vote button disabled state
	const isVoteDisabled = $derived(
		is_voting || report.reporter_id === currentUser?.id || !currentUser
	);

	// Vote button hover enabled state
	const canHoverVote = $derived(currentUser !== null && report.reporter_id !== currentUser.id);

	// Fetch user's vote on this report
	async function fetchUserVote() {
		if (!currentUser) return;
		try {
			const vote = await pb
				.collection('votes')
				.getFirstListItem(`report = "${report.id}" && voter = "${currentUser.id}"`, {
					fields: 'id,vote_type'
				});
			user_vote = { id: vote.id, vote_type: vote.vote_type };
		} catch {
			user_vote = null;
		}
	}

	// Handle vote action
	async function handleVote(voteType: 'up' | 'down') {
		if (!currentUser || is_voting) return;

		is_voting = true;

		const previous_vote = user_vote;
		const previous_upvotes = local_upvotes;
		const previous_downvotes = local_downvotes;

		try {
			if (user_vote?.vote_type === voteType) {
				// Remove vote
				if (voteType === 'up') {
					local_upvotes--;
				} else {
					local_downvotes--;
				}
				user_vote = null;
				if (previous_vote) {
					await deleteVote(previous_vote.id);
				}
			} else if (user_vote && user_vote.vote_type !== voteType) {
				// Change vote type
				if (user_vote.vote_type === 'up') {
					local_upvotes--;
					local_downvotes++;
				} else {
					local_downvotes--;
					local_upvotes++;
				}
				await deleteVote(user_vote.id);
				const voteId = await createVote(report.id, voteType);
				user_vote = { id: voteId, vote_type: voteType };
			} else {
				// Create new vote
				if (voteType === 'up') {
					local_upvotes++;
				} else {
					local_downvotes++;
				}
				const voteId = await createVote(report.id, voteType);
				user_vote = { id: voteId, vote_type: voteType };
			}
		} catch (error) {
			console.error('Error voting:', error);
			const errorMsg = error instanceof Error ? error.message : 'Failed to submit vote';
			showToast.error(errorMsg);
			// Revert optimistic update
			user_vote = previous_vote;
			local_upvotes = previous_upvotes;
			local_downvotes = previous_downvotes;
		} finally {
			is_voting = false;
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

	// Only fetch user's vote if not passed in as a prop
	$effect(() => {
		if (passedUserVote === undefined && currentUser && report.id) {
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
					class:text-green-600={user_vote?.vote_type === 'up'}
					class:font-semibold={user_vote?.vote_type === 'up'}
					class:hover:text-green-500={user_vote?.vote_type !== 'up' && canHoverVote}
					aria-label="Upvote"
					disabled={isVoteDisabled}
					onclick={() => handleVote('up')}
				>
					<ThumbsUpIcon class="h-4 w-4" />
					<span class="text-xs">{local_upvotes}</span>
				</button>
				<button
					class="flex items-center gap-1 rounded-md px-2 py-1 transition-colors disabled:opacity-50"
					class:text-red-600={user_vote?.vote_type === 'down'}
					class:font-semibold={user_vote?.vote_type === 'down'}
					class:hover:text-red-500={user_vote?.vote_type !== 'down' && canHoverVote}
					aria-label="Downvote"
					disabled={isVoteDisabled}
					onclick={() => handleVote('down')}
				>
					<ThumbsDownIcon class="h-4 w-4" />
					<span class="text-xs">{local_downvotes}</span>
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
