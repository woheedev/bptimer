<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { getLocationImagePath, getLocationName } from '$lib/utils/mob-utils';
	import MapPin from '@lucide/svelte/icons/map-pin';

	let {
		mobName,
		mobType,
		locationImageNumber
	}: {
		mobName: string;
		mobType: 'boss' | 'magical_creature' | string;
		locationImageNumber: number;
	} = $props();

	const locationPath = $derived(getLocationImagePath(mobName, mobType, locationImageNumber));
	const locationName = $derived(getLocationName(mobName, locationImageNumber));
	let popoverOpen = $state(false);
</script>

<Popover.Root bind:open={popoverOpen}>
	<Popover.Trigger class="w-full">
		<Button variant="outline" size="default" class="w-full justify-start gap-2">
			<MapPin class="h-3 w-3" />
			<span class="text-xs">Last Reported Location: {locationName}</span>
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-auto max-w-xs p-2">
		<img
			src={locationPath}
			alt={locationName}
			class="h-auto w-full max-w-full rounded object-contain"
			onerror={(e) => {
				(e.target as HTMLImageElement).style.display = 'none';
			}}
		/>
	</Popover.Content>
</Popover.Root>
