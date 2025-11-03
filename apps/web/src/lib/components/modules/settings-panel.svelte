<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import { MODULE_MAX_PRIORITY_EFFECTS, MODULE_SLOTS } from '$lib/constants';
	import { Info, Settings, Sparkles } from '@lucide/svelte/icons';

	interface Props {
		numSlots: string;
		priorityEffects: string[];
		canCalculate: boolean;
		isCalculating: boolean;
		validModulesCount: number;
		onSlotsChange: (value: string) => void;
		onCalculate: () => void;
		onManagePriorities: () => void;
	}

	let {
		numSlots,
		priorityEffects,
		canCalculate,
		isCalculating,
		validModulesCount,
		onSlotsChange,
		onCalculate,
		onManagePriorities
	}: Props = $props();

	const selectedSlotOption = $derived(
		MODULE_SLOTS.find((slot) => slot.value.toString() === numSlots)
	);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-center gap-2">
			<Settings class="h-5 w-5" />
			Settings
		</Card.Title>
	</Card.Header>
	<Card.Content class="space-y-4">
		<div>
			<Label for="slots" class="text-sm font-medium">Module Slots</Label>
			<Select.Root type="single" value={numSlots} onValueChange={onSlotsChange}>
				<Select.Trigger id="slots" class="w-full">
					{selectedSlotOption?.label || 'Select slots...'}
				</Select.Trigger>
				<Select.Content>
					{#each MODULE_SLOTS as slot (slot.value)}
						<Select.Item value={slot.value.toString()}>
							{slot.label}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<Separator />

		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<Info class="text-muted-foreground h-4 w-4" />
				<span class="text-sm font-medium">Priority Effects</span>
			</div>
			<p class="text-muted-foreground text-xs">
				Selected: {priorityEffects.length}/{MODULE_MAX_PRIORITY_EFFECTS}
			</p>
			<div class="flex flex-wrap gap-1">
				{#if priorityEffects.length === 0}
					<span class="text-muted-foreground text-xs">None selected</span>
				{:else}
					{#each priorityEffects as effect (effect)}
						<Badge variant="default" class="text-xs">
							{effect}
						</Badge>
					{/each}
				{/if}
			</div>
			<Button variant="outline" size="sm" class="w-full" onclick={onManagePriorities}>
				Manage Priority Effects
			</Button>
		</div>

		<Separator />

		<Button
			class="w-full"
			onclick={onCalculate}
			disabled={isCalculating || !canCalculate}
			size="lg"
		>
			{#if isCalculating}
				<div class="flex items-center gap-2">
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
					Calculating...
				</div>
			{:else}
				<div class="flex items-center gap-2">
					<Sparkles class="h-4 w-4" />
					Find Optimal Setup
				</div>
			{/if}
		</Button>

		{#if !canCalculate && validModulesCount > 0}
			<div class="text-muted-foreground text-xs">
				{#if validModulesCount < parseInt(numSlots)}
					Need {parseInt(numSlots) - validModulesCount} more valid modules
				{:else}
					Select at least one priority effect
				{/if}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
