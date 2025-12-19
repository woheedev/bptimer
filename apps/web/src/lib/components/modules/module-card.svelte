<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { Module } from '$lib/schemas';
	import { GripVertical, Trash } from '@lucide/svelte/icons';
	import EffectSelector from './effect-selector.svelte';

	interface Props {
		module: Module;
		moduleIndex: number;
		canRemove: boolean;
		onRemove: () => void;
		onUpdateEffect: (effectIndex: number, field: 'name' | 'level', value: string | number) => void;
	}

	let { module, moduleIndex, canRemove, onRemove, onUpdateEffect }: Props = $props();

	const hasActiveEffects = $derived(module.effects.some((e) => e.name && e.level > 0));
</script>

<Card.Root class="relative">
	<Card.Header>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<GripVertical class="h-4 w-4 text-muted-foreground" />
				<Card.Title class="text-lg">{module.id}</Card.Title>
				{#if hasActiveEffects}
					<Badge variant="secondary" class="text-xs">Active</Badge>
				{/if}
			</div>
			{#if canRemove}
				<Button
					variant="outline"
					size="sm"
					onclick={onRemove}
					class="text-destructive hover:text-destructive"
					aria-label="Remove {module.id}"
				>
					<Trash class="h-4 w-4" />
				</Button>
			{/if}
		</div>
	</Card.Header>
	<Card.Content class="space-y-4">
		{#each module.effects as effect, effectIndex (effectIndex)}
			<EffectSelector
				{moduleIndex}
				{effectIndex}
				effectName={effect.name}
				effectLevel={effect.level}
				onEffectChange={(name) => onUpdateEffect(effectIndex, 'name', name)}
				onLevelChange={(level) => onUpdateEffect(effectIndex, 'level', level)}
			/>
		{/each}
	</Card.Content>
</Card.Root>
