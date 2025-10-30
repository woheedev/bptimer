<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { DAY, LAUNCH_REFERENCE_DATE } from '$lib/constants';

	const days = Math.floor((Date.now() - new Date(LAUNCH_REFERENCE_DATE).getTime()) / DAY);
</script>

<div class="px-2 py-2">
	<Badge variant="secondary">Day {days}</Badge>
</div>
