<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		MODULE_MAX_PRIORITY_EFFECTS,
		MODULE_PRIORITY_MULTIPLIERS,
		MODULE_WEIGHT_MAX
	} from '$lib/constants';
	import { getAvailableEffects } from '$lib/utils/modules';
	import { ArrowDown, ArrowUp, Info, Plus, Target, Trash } from '@lucide/svelte/icons';

	interface Props {
		priorityEffects: string[];
		effectWeights: number[];
		effectMinLevels: number[];
		onToggle: (effect: string) => void;
		onWeightChange: (index: number, weight: number) => void;
		onMinLevelChange: (index: number, minLevel: number) => void;
	}

	let {
		priorityEffects,
		effectWeights,
		effectMinLevels,
		onToggle,
		onWeightChange,
		onMinLevelChange
	}: Props = $props();

	const availableEffects = $derived(getAvailableEffects(priorityEffects));
	const resolvedWeights = $derived(
		priorityEffects.map((_, i) => effectWeights[i] ?? MODULE_PRIORITY_MULTIPLIERS[i] ?? 1)
	);
	const resolvedMinLevels = $derived(priorityEffects.map((_, i) => effectMinLevels[i] ?? 0));

	const sortedRows = $derived(
		priorityEffects
			.map((effect, i) => ({
				effect,
				weight: resolvedWeights[i],
				minLevel: resolvedMinLevels[i],
				index: i
			}))
			.sort((a, b) => b.weight - a.weight || a.effect.localeCompare(b.effect))
	);
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Card.Root>
		<Card.Header>
			<Card.Title>Available Effects</Card.Title>
			<p class="text-sm text-muted-foreground">
				Click to add to priority effects (max {MODULE_MAX_PRIORITY_EFFECTS})
			</p>
		</Card.Header>
		<Card.Content>
			<div class="grid max-h-96 gap-2 overflow-y-auto">
				{#each availableEffects as effect (effect)}
					<div
						class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
					>
						<span class="text-sm font-medium">{effect}</span>
						<Button
							variant="ghost"
							size="sm"
							onclick={() => onToggle(effect)}
							disabled={priorityEffects.length >= MODULE_MAX_PRIORITY_EFFECTS}
							class="h-8 w-8 p-0"
						>
							<Plus class="h-3 w-3" />
						</Button>
					</div>
				{/each}
				{#if availableEffects.length === 0}
					<div class="py-8 text-center text-muted-foreground">
						<Info class="mx-auto mb-2 h-8 w-8" />
						<p class="text-sm">All effects have been selected</p>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center justify-between">
				<span>Priority Effects ({priorityEffects.length}/{MODULE_MAX_PRIORITY_EFFECTS})</span>
				{#if priorityEffects.length > 0}
					<Badge variant="outline">{priorityEffects.length} selected</Badge>
				{/if}
			</Card.Title>
			<p class="text-sm text-muted-foreground">
				Arrows adjust weight • Higher priority = higher multiplier
			</p>
		</Card.Header>
		<Card.Content>
			{#if priorityEffects.length === 0}
				<div class="flex flex-col items-center justify-center py-8 text-center">
					<Target class="mb-4 h-12 w-12 text-muted-foreground" />
					<p class="text-muted-foreground">No priority effects selected</p>
					<p class="text-sm text-muted-foreground">
						Add effects from the available list to get started
					</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each sortedRows as row (row.effect)}
						{@const idx = row.index}
						<div class="flex items-center gap-2 rounded-lg border p-3">
							<div class="flex min-w-0 flex-1 items-center gap-2">
								<Badge variant="outline" class="shrink-0 font-mono text-xs">
									{row.weight}
								</Badge>
								<span class="min-w-0 flex-1 truncate font-medium">{row.effect}</span>
								<div class="ml-auto flex shrink-0 items-center gap-1">
									<span class="text-xs text-muted-foreground">Minimum</span>
									<Label for="min-{idx}" class="sr-only">Minimum level</Label>
									<Input
										id="min-{idx}"
										type="number"
										min={0}
										max={20}
										value={row.minLevel}
										oninput={(e) => {
											const v = parseInt((e.target as HTMLInputElement).value, 10);
											if (!Number.isNaN(v) && v >= 0 && v <= 20) {
												onMinLevelChange(idx, v);
											}
										}}
										class="h-8 w-14 text-center"
									/>
								</div>
							</div>
							<div class="flex shrink-0 gap-1">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onWeightChange(idx, Math.min(MODULE_WEIGHT_MAX, row.weight + 1))}
									disabled={row.weight >= MODULE_WEIGHT_MAX}
									class="h-8 w-8 p-0"
								>
									<ArrowUp class="h-3 w-3" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onWeightChange(idx, Math.max(1, row.weight - 1))}
									disabled={row.weight <= 1}
									class="h-8 w-8 p-0"
								>
									<ArrowDown class="h-3 w-3" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onToggle(row.effect)}
									class="h-8 w-8 p-0 text-destructive hover:text-destructive"
								>
									<Trash class="h-3 w-3" />
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
