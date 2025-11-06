<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { DAY, GAME_TIMEZONE_OFFSET, HOUR, LAUNCH_REFERENCE_DATE } from '$lib/constants';

	const DAILY_RESET_HOUR = 5; // 5AM UTC-2

	function calculateGameDay(): number {
		const gameLaunch = new Date(LAUNCH_REFERENCE_DATE);
		gameLaunch.setUTCHours(DAILY_RESET_HOUR - GAME_TIMEZONE_OFFSET, 0, 0, 0);
		const gameNow = new Date(Date.now() + GAME_TIMEZONE_OFFSET * HOUR);
		return Math.floor((gameNow.getTime() - gameLaunch.getTime()) / DAY) + 1;
	}

	const days = calculateGameDay();
</script>

<div>
	<Badge variant="secondary">Day {days}</Badge>
</div>
