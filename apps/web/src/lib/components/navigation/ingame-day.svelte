<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { DAY, GAME_TIMEZONE_OFFSET, HOUR, LAUNCH_REFERENCE_DATE } from '$lib/constants';

	const DAILY_RESET_HOUR = 5; // 5AM UTC-2

	function calculateGameDay(): number {
		const now = Date.now();
		const launchTime = new Date(LAUNCH_REFERENCE_DATE).getTime();
		const RESET_OFFSET = DAILY_RESET_HOUR * HOUR;
		const gameNow = now + GAME_TIMEZONE_OFFSET * HOUR - RESET_OFFSET;
		const gameLaunch = launchTime + GAME_TIMEZONE_OFFSET * HOUR - RESET_OFFSET;

		return Math.floor((gameNow - gameLaunch) / DAY) + 1;
	}

	const days = calculateGameDay();
</script>

<div>
	<Badge variant="secondary">Day {days}</Badge>
</div>
