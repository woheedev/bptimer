<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import {
		MODULE_AVAILABLE_EFFECTS,
		MODULE_EFFECT_MAX_LEVEL,
		MODULE_THIRD_EFFECT_MAX_LEVEL
	} from '$lib/constants';
	import { Check, ChevronsUpDown } from '@lucide/svelte/icons';

	interface Props {
		moduleIndex: number;
		effectIndex: number;
		effectName: string;
		effectLevel: number;
		onEffectChange: (effectName: string) => void;
		onLevelChange: (level: number) => void;
	}

	let { moduleIndex, effectIndex, effectName, effectLevel, onEffectChange, onLevelChange }: Props =
		$props();

	let isOpen = $state(false);
	const maxLevel = effectIndex === 2 ? MODULE_THIRD_EFFECT_MAX_LEVEL : MODULE_EFFECT_MAX_LEVEL;

	function handleKeyDown(event: KeyboardEvent) {
		if (!isOpen && event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
			event.preventDefault();
			isOpen = true;
		}
	}

	function handleLevelChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		let value = parseInt(input.value) || 0;

		if (value > maxLevel) {
			value = maxLevel;
			input.value = value.toString();
		}

		onLevelChange(value);
	}

	function handleLevelInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		let value = parseInt(input.value) || 0;

		if (value > maxLevel) {
			input.value = maxLevel.toString();
		}
	}
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
	<div class="sm:col-span-3">
		<Label for="effect-{moduleIndex}-{effectIndex}" class="text-sm">
			Effect {effectIndex + 1}
		</Label>
		<Popover.Root bind:open={isOpen}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						role="combobox"
						aria-expanded={isOpen}
						aria-label={effectName ? `Effect ${effectIndex + 1}: ${effectName}` : `Select effect ${effectIndex + 1}`}
						class="w-full justify-between"
						onkeydown={handleKeyDown}
					>
						{effectName || 'Select effect...'}
						<ChevronsUpDown class="opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-full p-0" align="start" side="bottom">
				<Command.Root>
					<Command.Input placeholder="Search effects..." />
					<Command.List>
						<Command.Empty>No effect found.</Command.Empty>
						{#if effectName}
							<Command.Group>
								<Command.Item
									value="none"
									onclick={() => {
										onEffectChange('');
										isOpen = false;
									}}
								>
									<span class="text-muted-foreground">None</span>
								</Command.Item>
							</Command.Group>
							<Command.Separator />
						{/if}
						<Command.Group heading="Available Effects">
							{#each MODULE_AVAILABLE_EFFECTS as availableEffect (availableEffect)}
								<Command.Item
									value={availableEffect}
									onclick={() => {
										onEffectChange(availableEffect);
										isOpen = false;
									}}
								>
									{availableEffect}
									{#if effectName === availableEffect}
										<Check class="ml-auto" />
									{/if}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>
	<div>
		<Label for="level-{moduleIndex}-{effectIndex}" class="text-sm">Lv.</Label>
		<Input
			type="number"
			id="level-{moduleIndex}-{effectIndex}"
			min="0"
			max={maxLevel}
			maxlength={2}
			value={effectLevel.toString()}
			oninput={handleLevelInput}
			onchange={handleLevelChange}
			placeholder="0"
			class="w-full [appearance:textfield] text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
		/>
	</div>
</div>
