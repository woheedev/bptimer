<script lang="ts">
	import { calculateGameDay, getGameTimezone } from '$lib/utils/general-utils';
	import { regionStore } from '$lib/stores/region.svelte';
	import { SvelteDate } from 'svelte/reactivity';

	const days = $derived(calculateGameDay(regionStore.value));
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

<span class="text-[0.7rem] font-medium text-muted-foreground">
	Day {days} • {formatter.format(gameTime)}
</span>
