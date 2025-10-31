<script lang="ts">
	import { browser } from '$app/environment';
	import { PRESENCE_COUNT_UPDATE_INTERVAL } from '$lib/constants';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { getActiveUsersCount, startPresenceTracking } from '$lib/utils/page-presence';

	let state = $state({
		activeUsers: 0,
		loading: true
	});

	// Start presence tracking
	$effect(() => {
		if (!browser) return;
		const cleanup = startPresenceTracking();
		return cleanup;
	});

	// Update count periodically
	$effect(() => {
		if (!browser) return;

		async function updateCount() {
			try {
				const count = await getActiveUsersCount();
				state.activeUsers = count;
				state.loading = false;
			} catch (error) {
				console.error('Failed to get active users count:', error);
				state.loading = false;
			}
		}

		updateCount();
		const countInterval = setInterval(updateCount, PRESENCE_COUNT_UPDATE_INTERVAL);

		return () => {
			clearInterval(countInterval);
		};
	});
</script>

<div>
	<Badge variant="secondary">
		{#if state.loading}
			<span class="opacity-50">...</span>
		{:else}
			{state.activeUsers} {state.activeUsers === 1 ? 'User' : 'Users'} Online
		{/if}
	</Badge>
</div>
