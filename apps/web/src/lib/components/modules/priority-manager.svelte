<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { MODULE_MAX_PRIORITY_EFFECTS, MODULE_PRIORITY_MULTIPLIERS } from '$lib/constants';
	import { getAvailableEffects } from '$lib/utils/modules';
	import { ArrowDown, ArrowUp, Info, Plus, Target, Trash } from '@lucide/svelte/icons';

	interface Props {
		priorityEffects: string[];
		onToggle: (effect: string) => void;
		onMove: (index: number, direction: 'up' | 'down') => void;
	}

	let { priorityEffects, onToggle, onMove }: Props = $props();

	const availableEffects = $derived(getAvailableEffects(priorityEffects));
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Card.Root>
		<Card.Header>
			<Card.Title>Available Effects</Card.Title>
			<p class="text-muted-foreground text-sm">
				Click to add to priority effects (max {MODULE_MAX_PRIORITY_EFFECTS})
			</p>
		</Card.Header>
		<Card.Content>
			<div class="grid max-h-96 gap-2 overflow-y-auto">
				{#each availableEffects as effect (effect)}
					<div
						class="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
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
					<div class="text-muted-foreground py-8 text-center">
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
			<p class="text-muted-foreground text-sm">
				Use arrows to reorder • Higher priority = higher score multiplier
			</p>
		</Card.Header>
		<Card.Content>
			{#if priorityEffects.length === 0}
				<div class="flex flex-col items-center justify-center py-8 text-center">
					<Target class="text-muted-foreground mb-4 h-12 w-12" />
					<p class="text-muted-foreground">No priority effects selected</p>
					<p class="text-muted-foreground text-sm">
						Add effects from the available list to get started
					</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each priorityEffects as effect, index (effect)}
						<div class="flex items-center gap-2 rounded-lg border p-3">
							<div class="flex flex-1 items-center gap-2">
								<Badge variant="outline" class="font-mono text-xs">
									{index + 1}
								</Badge>
								<span class="font-medium">{effect}</span>
								<Badge variant="secondary" class="text-xs">
									×{MODULE_PRIORITY_MULTIPLIERS[index] ?? 0}
								</Badge>
							</div>
							<div class="flex gap-1">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onMove(index, 'up')}
									disabled={index === 0}
									class="h-8 w-8 p-0"
								>
									<ArrowUp class="h-3 w-3" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onMove(index, 'down')}
									disabled={index === priorityEffects.length - 1}
									class="h-8 w-8 p-0"
								>
									<ArrowDown class="h-3 w-3" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onToggle(effect)}
									class="text-destructive hover:text-destructive h-8 w-8 p-0"
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
