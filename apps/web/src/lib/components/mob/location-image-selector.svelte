<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		getLocationImagePath,
		getLocationImagePaths,
		getLocationName
	} from '$lib/utils/mob-utils';
	import MapPin from '@lucide/svelte/icons/map-pin';

	let {
		mobName,
		mobType,
		selectedLocation = $bindable<number | null>(null),
		required = false
	}: {
		mobName: string;
		mobType: 'boss' | 'magical_creature' | string;
		selectedLocation?: number | null;
		required?: boolean;
	} = $props();

	const locationPaths = $derived(getLocationImagePaths(mobName, mobType));
	const hasLocations = $derived(locationPaths.length > 0);
	const locationCount = $derived(locationPaths.length);

	// Initialize with first location if none selected
	$effect(() => {
		if (selectedLocation === null && hasLocations && locationCount > 0) {
			selectedLocation = 1;
		}
	});

	let popoverOpen = $state(false);
	let carouselApi = $state<CarouselAPI | undefined>(undefined);

	function handleLocationSelect(locationNumber: number) {
		selectedLocation = locationNumber;
		popoverOpen = false;
	}

	// Reset API reference when popover closes to prevent stale references
	$effect(() => {
		if (!popoverOpen) {
			carouselApi = undefined;
		}
	});

	// Scroll to selected location when carousel API becomes available and popover is open
	$effect(() => {
		if (popoverOpen && carouselApi && selectedLocation !== null) {
			const index = selectedLocation - 1;
			queueMicrotask(() => {
				carouselApi?.scrollTo(index, true);
			});
		}
	});

	// Get display text for selected location
	const selectedLocationText = $derived(
		selectedLocation !== null ? getLocationName(mobName, selectedLocation) : 'Select location'
	);
</script>

{#if hasLocations}
	<div class="space-y-2">
		<Popover.Root bind:open={popoverOpen}>
			<Popover.Trigger class="w-full">
				<Button variant="outline" class="w-full justify-between">
					<MapPin class="h-4 w-4" />
					{selectedLocationText}
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-auto max-w-xs p-4">
				<Carousel.Root
					class="relative w-full"
					opts={{ loop: true }}
					setApi={(api) => {
						carouselApi = api;
					}}
				>
					<Carousel.Content>
						{#each Array.from({ length: locationCount }, (_, i) => i) as index (index)}
							{@const locationNumber = index + 1}
							{@const locationPath = getLocationImagePath(mobName, mobType, locationNumber)}
							{@const locationName = getLocationName(mobName, locationNumber)}
							<Carousel.Item>
								<div class="p-1">
									<button
										type="button"
										onclick={() => handleLocationSelect(locationNumber)}
										class="relative w-full overflow-hidden rounded-md border-2 transition-all {selectedLocation ===
										locationNumber
											? 'border-primary ring-primary ring-2 ring-offset-2'
											: 'border-border hover:border-primary/50'}"
										aria-label="Select {locationName}"
										aria-pressed={selectedLocation === locationNumber}
									>
										<div class="bg-muted relative aspect-square overflow-hidden">
											<img
												src={locationPath}
												alt={locationName}
												class="h-full w-full object-contain"
												onerror={(e) => {
													(e.target as HTMLImageElement).style.display = 'none';
												}}
											/>
										</div>
										<div class="absolute right-1 bottom-1">
											<span class="bg-background/80 rounded px-1.5 py-0.5 text-xs font-medium">
												{locationNumber}
											</span>
										</div>
									</button>
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>
					{#if locationCount > 1}
						<Carousel.Previous class="left-3" />
						<Carousel.Next class="right-3" />
					{/if}
				</Carousel.Root>
			</Popover.Content>
		</Popover.Root>
		{#if required && selectedLocation === null}
			<p class="text-muted-foreground text-xs">
				Please select a location image for this magical creature
			</p>
		{/if}
	</div>
{/if}
