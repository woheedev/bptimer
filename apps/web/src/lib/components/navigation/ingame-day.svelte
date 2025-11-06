<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { calculateGameDay } from '$lib/utils/general-utils';

	const days = calculateGameDay();
</script>

<div>
	<Badge variant="secondary">Day {days}</Badge>
</div>
