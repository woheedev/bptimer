<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import {
		HP_SLIDER_STEP,
		MAX_HP_VALUE,
		MIN_HP_VALUE,
		SPECIAL_MAGICAL_CREATURE_LOCATION_COUNTS
	} from '$lib/constants';
	import { hpSubmissionInputSchema } from '$lib/schemas';
	import type { UserRecordModel } from '$lib/types/auth';
	import { showToast } from '$lib/utils/toast';
	import Skull from '@lucide/svelte/icons/skull';
	import LocationImageSelector from '$lib/components/mob/location-image-selector.svelte';

	let {
		selectedChannel,
		user,
		mobName,
		mobType,
		hpValue = $bindable(100),
		locationImage = $bindable<number | null>(null),
		isSubmitting,
		onSubmit
	}: {
		selectedChannel: number | null;
		user: UserRecordModel | null;
		mobName: string;
		mobType: 'boss' | 'magical_creature' | string;
		hpValue: number;
		locationImage?: number | null;
		isSubmitting: boolean;
		onSubmit: () => void;
	} = $props();

	let validationError = $state<string>('');

	// Check if this is a special magical creature
	const requiresLocation = $derived(mobName in SPECIAL_MAGICAL_CREATURE_LOCATION_COUNTS);

	// Validate HP value changes
	$effect(() => {
		if (selectedChannel && user) {
			try {
				hpSubmissionInputSchema.shape.hp_percentage.parse(hpValue);
				validationError = '';
			} catch {
				validationError = 'HP must be between 0-100';
			}
		}
	});

	function handleSubmit() {
		if (!selectedChannel || !user || validationError) return;

		// Validate location image for magical creatures
		if (requiresLocation && locationImage === null) {
			showToast.error('Please select a location image for this magical creature');
			return;
		}

		try {
			// Validate the submission input before submission
			hpSubmissionInputSchema.parse({
				channel: selectedChannel,
				hp_percentage: hpValue
			});
			onSubmit();
		} catch (error) {
			console.error('Validation failed:', error);
			const errorMsg = error instanceof Error ? error.message : 'Invalid input';
			showToast.error(errorMsg);
		}
	}
</script>

{#if selectedChannel && user}
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<Card.Title class="text-base">Report HP</Card.Title>
				<span class="text-muted-foreground text-sm">Line {selectedChannel}</span>
			</div>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="space-y-2">
				<Label for="hp-slider" class="text-sm font-medium">HP: {hpValue}%</Label>
				<Slider
					id="hp-slider"
					bind:value={hpValue}
					type="single"
					step={HP_SLIDER_STEP}
					min={MIN_HP_VALUE}
					max={MAX_HP_VALUE}
					class="w-full"
				/>
				{#if validationError}
					<p class="text-destructive text-sm">{validationError}</p>
				{/if}
			</div>
			{#if requiresLocation}
				<LocationImageSelector
					{mobName}
					{mobType}
					bind:selectedLocation={locationImage}
					required={true}
				/>
			{/if}
			<div class="flex gap-2">
				<Button
					onclick={() => (hpValue = 0)}
					size="icon"
					variant="destructive"
					class="px-2"
					title="Set HP to 0"
				>
					<Skull class="h-4 w-4" />
				</Button>
				<Button
					onclick={handleSubmit}
					disabled={isSubmitting || !!validationError}
					class="flex-1"
					variant="default"
				>
					{isSubmitting ? 'Submitting...' : 'Submit Report'}
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
{:else if selectedChannel && !user}
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Report HP</Card.Title>
		</Card.Header>
		<Card.Content class="py-4 text-center">
			<p class="text-muted-foreground mb-3 text-sm">Please sign in to report HP</p>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Select a Channel</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-sm">Click on any channel to submit an HP report</p>
		</Card.Content>
	</Card.Root>
{/if}
