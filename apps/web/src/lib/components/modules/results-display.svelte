<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { MODULE_TIER_THRESHOLDS } from '$lib/constants';
	import type { OptimizationResult } from '$lib/types/modules';
	import { Calculator, Sparkles, Target } from '@lucide/svelte/icons';

	interface Props {
		result: OptimizationResult | null;
	}

	let { result }: Props = $props();

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
				// If at max tier, return same threshold
				if (i === 0) return MODULE_TIER_THRESHOLDS[i].threshold;
				// Otherwise return next higher threshold
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
					Optimal Module Combination
				</Card.Title>
				<Badge variant="default" class="ml-auto">
					Score: {result.totalScore}
				</Badge>
			</Card.Header>
			<Card.Content class="space-y-1.5">
				{#each result.optimalModules as module (module.id)}
					<div class="rounded-md border-2 border-dashed p-2.5">
						<div class="text-muted-foreground mb-1 text-xs font-medium">{module.id}</div>
						<div class="space-y-0.5">
							{#each module.effects.filter((e) => e.name && e.level > 0) as effect (`${effect.name}-${effect.level}`)}
								<div class="flex items-center justify-between text-sm">
									<span>{effect.name}</span>
									<div class="flex items-center gap-1.5">
										{#if result.prioritizedEffects[effect.name]}
											<Badge variant="default" class="text-xs">Priority</Badge>
										{/if}
										<Badge variant="secondary" class="text-xs">Lv.{effect.level}</Badge>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Combined Effects</Card.Title>
				<p class="text-muted-foreground text-sm">Total effects from optimal combination</p>
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
								<div class="bg-muted/50 flex justify-between rounded p-2 text-sm">
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
		<Calculator class="text-muted-foreground mx-auto mb-4 h-16 w-16" />
		<h3 class="mb-2 text-lg font-medium">No Results Yet</h3>
		<p class="text-muted-foreground mb-4">
			Configure your modules and priority effects, then calculate the optimal setup
		</p>
	</div>
{/if}
