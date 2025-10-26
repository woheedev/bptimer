<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { HP_SLIDER_STEP, MAX_HP_VALUE, MIN_HP_VALUE } from '$lib/constants';
	import { hpSubmissionInputSchema } from '$lib/schemas';
	import type { UserRecordModel } from '$lib/types/auth';

	let {
		selectedChannel,
		user,
		hpValue = $bindable(100),
		fullVoteCount = $bindable(0),
		isSubmitting,
		onSubmit
	}: {
		selectedChannel: number | null;
		user: UserRecordModel | null;
		hpValue: number;
		fullVoteCount: number;
		isSubmitting: boolean;
		onSubmit: () => void;
	} = $props();

	let validationError = $state<string>('');

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

		try {
			// Validate the submission input before submission
			hpSubmissionInputSchema.parse({
				channel: selectedChannel,
				hp_percentage: hpValue
			});
			onSubmit();
		} catch (error) {
			console.error('Validation failed:', error);
			// Could show error to user here
		}
	}
</script>

{#if selectedChannel && user}
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Report HP - Channel {selectedChannel}</Card.Title>
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
			<div class="flex w-full gap-2">
				<Button onclick={() => (hpValue = 0)} size="sm" variant="destructive" class="flex-1"
					>Dead</Button
				>
				<Button onclick={() => fullVoteCount++} size="sm" variant="outline" class="relative flex-1">
					Full
					{#if fullVoteCount > 0}
						<Badge
							variant="default"
							class="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-[10px]"
						>
							{fullVoteCount}
						</Badge>
					{/if}
				</Button>
			</div>
			<Button
				onclick={handleSubmit}
				disabled={isSubmitting || !!validationError}
				class="w-full"
				variant="default"
			>
				{isSubmitting ? 'Submitting...' : 'Submit Report'}
			</Button>
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
