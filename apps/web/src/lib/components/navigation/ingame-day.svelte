<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { calculateGameDay, getGameTimezone } from '$lib/utils/general-utils';
	import { SvelteDate } from 'svelte/reactivity';

	const days = calculateGameDay();
	const gameTime = new SvelteDate();

	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: getGameTimezone(),
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	});

	$effect(() => {
		const interval = setInterval(() => {
			gameTime.setTime(Date.now());
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<div>
	<Badge variant="secondary">Day {days} - {formatter.format(gameTime)}</Badge>
</div>
