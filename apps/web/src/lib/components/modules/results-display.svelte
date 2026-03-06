<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Separator } from '$lib/components/ui/separator';
	import { MODULE_TIER_THRESHOLDS } from '$lib/constants';
	import type { OptimizationResult } from '$lib/types/modules';
	import { Calculator, ChevronDown, ChevronUp, Sparkles, Target } from '@lucide/svelte/icons';

	interface Props {
		result: OptimizationResult | null;
	}

	let { result }: Props = $props();
	let expandedRank = $state<number | null>(0);

	$effect(() => {
		if (result) expandedRank = 0;
	});

	// Tier names corresponding to thresholds
	const TIER_NAMES = ['VI', 'V', 'IV', 'III', 'II', 'I'] as const;

	function getScoreTier(level: number): string {
		for (let i = 0; i < MODULE_TIER_THRESHOLDS.length; i++) {
			if (level >= MODULE_TIER_THRESHOLDS[i].threshold) {
				return TIER_NAMES[i];
			}
		}
		return 'I';
	}

	function getNextTierThreshold(level: number): number {
		for (let i = 0; i < MODULE_TIER_THRESHOLDS.length; i++) {
			if (level >= MODULE_TIER_THRESHOLDS[i].threshold) {
				if (i === 0) return MODULE_TIER_THRESHOLDS[i].threshold;
				return MODULE_TIER_THRESHOLDS[i - 1].threshold;
			}
		}
		return MODULE_TIER_THRESHOLDS[MODULE_TIER_THRESHOLDS.length - 1].threshold;
	}
</script>

{#if result}
	<div class="grid gap-6 lg:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Sparkles class="h-5 w-5" />
					Top Module Combinations
				</Card.Title>
				<Badge variant="default" class="ml-auto">
					Best: {result.totalScore}
				</Badge>
			</Card.Header>
			<Card.Content class="space-y-2">
				{#each result.topResults as single, rank (rank)}
					{@const isExpanded = expandedRank === rank}
					<Collapsible.Root
						open={isExpanded}
						onOpenChange={(o) => (expandedRank = o ? rank : null)}
					>
						<Collapsible.Trigger
							class="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
						>
							<div class="flex items-center gap-2">
								<Badge variant={rank === 0 ? 'default' : 'secondary'} class="font-mono">
									#{rank + 1}
								</Badge>
								<span class="font-medium">Score: {single.totalScore}</span>
							</div>
							{#if isExpanded}
								<ChevronUp class="h-4 w-4" />
							{:else}
								<ChevronDown class="h-4 w-4" />
							{/if}
						</Collapsible.Trigger>
						<Collapsible.Content>
							<div class="space-y-1.5 rounded-b-lg border-x border-t-0 border-b p-3">
								{#each single.optimalModules as module (module.id)}
									<div class="rounded-md border-2 border-dashed p-2.5">
										<div class="mb-1 text-xs font-medium text-muted-foreground">{module.id}</div>
										<div class="space-y-0.5">
											{#each module.effects.filter((e) => e.name && e.level > 0) as effect (`${effect.name}-${effect.level}`)}
												<div class="flex items-center justify-between text-sm">
													<span>{effect.name}</span>
													<div class="flex items-center gap-1.5">
														{#if single.prioritizedEffects[effect.name]}
															<Badge variant="default" class="text-xs">Priority</Badge>
														{/if}
														<Badge variant="secondary" class="text-xs">Lv.{effect.level}</Badge>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</Collapsible.Content>
					</Collapsible.Root>
				{/each}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Combined Effects (Best)</Card.Title>
				<p class="text-sm text-muted-foreground">Total effects from #1 combination</p>
			</Card.Header>
			<Card.Content>
				<div class="space-y-2">
					{#each Object.entries(result.combinedEffects) as [effect, level] (effect)}
						<div class="flex items-center justify-between rounded-lg border p-3">
							<div class="flex items-center gap-3">
								<span class="font-medium">{effect}</span>
								{#if result.prioritizedEffects[effect]}
									<Badge variant="default" class="text-xs">Priority</Badge>
								{/if}
							</div>
							<div class="flex items-center gap-2">
								<span class="text-lg font-bold">+{level}</span>
								<Badge variant="secondary" class="text-xs">
									{getScoreTier(level)}
								</Badge>
							</div>
						</div>
					{/each}
				</div>

				{#if Object.keys(result.prioritizedEffects).length > 0}
					<Separator class="my-4" />
					<div>
						<h4 class="mb-2 flex items-center gap-2 font-medium">
							<Target class="h-4 w-4" />
							Priority Effects Summary
						</h4>
						<div class="space-y-1">
							{#each Object.entries(result.prioritizedEffects) as [effect, level] (effect)}
								<div class="flex justify-between rounded bg-muted/50 p-2 text-sm">
									<span>{effect}</span>
									<span class="font-medium">+{level}/{getNextTierThreshold(level)}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{:else}
	<div class="py-12 text-center">
		<Calculator class="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
		<h3 class="mb-2 text-lg font-medium">No Results Yet</h3>
		<p class="mb-4 text-muted-foreground">
			Configure your modules and priority effects, then calculate the optimal setup
		</p>
	</div>
{/if}
