<script lang="ts">
	import LocationImageSelector from '$lib/components/mob/location-image-selector.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import {
		HP_SLIDER_STEP,
		MAX_HP_VALUE,
		MIN_HP_VALUE,
		SPECIAL_MAGICAL_CREATURES
	} from '$lib/constants';
	import { hpSubmissionInputSchema } from '$lib/schemas';
	import type { UserRecordModel } from '$lib/types/auth';
	import { showToast } from '$lib/utils/toast';
	import Skull from '@lucide/svelte/icons/skull';

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
	const requiresLocation = $derived(mobName in SPECIAL_MAGICAL_CREATURES);

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
		<Card.Content class="space-y-4">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Label for="hp-slider" class="text-sm font-medium">HP: {hpValue}%</Label>
					<Badge variant="destructive" class="text-xs">Line {selectedChannel}</Badge>
				</div>
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
	<Card.Root class="py-4">
		<Card.Content class="text-center">
			<p class="text-muted-foreground text-sm">Sign in to submit reports</p>
		</Card.Content>
	</Card.Root>
{/if}
