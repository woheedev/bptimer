<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Switch } from '$lib/components/ui/switch';
	import type {
		HideStaleChannels,
		HpRange,
		SortDirection,
		SortDirectionOption,
		SortField,
		SortFieldOption
	} from '$lib/types/ui';
	import Settings2 from '@lucide/svelte/icons/settings-2';

	// Filter and sort options for channel display
	interface Props {
		sortField?: SortField;
		sortDirection?: SortDirection;
		hpRange?: HpRange;
		hideStaleChannels?: HideStaleChannels;
	}

	let {
		sortField = $bindable('channel'),
		sortDirection = $bindable('ascending'),
		hpRange = $bindable([0, 100]),
		hideStaleChannels = $bindable(false)
	}: Props = $props();

	const sortFieldOptions: SortFieldOption[] = [
		{ value: 'channel', label: 'Line Number' },
		{ value: 'hp', label: 'HP' }
	];

	const sortDirectionOptions: SortDirectionOption[] = [
		{ value: 'ascending', label: 'Ascending' },
		{ value: 'descending', label: 'Descending' }
	];

	let sortFieldTriggerContent = $derived(
		sortFieldOptions.find((option) => option.value === sortField)?.label ?? 'Line Number'
	);

	let sortDirectionTriggerContent = $derived(
		sortDirectionOptions.find((option) => option.value === sortDirection)?.label ?? 'Ascending'
	);
</script>

<Popover.Root>
	<Popover.Trigger class="flex items-center justify-center">
		<Button variant="outline" size="sm" title="Filter & Sort">
			<Settings2 class="h-4 w-4" />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-80">
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="sort-field">Sort by</Label>
				<Select.Root type="single" name="sortField" bind:value={sortField}>
					<Select.Trigger class="w-full">
						{sortFieldTriggerContent}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each sortFieldOptions as option (option.value)}
								<Select.Item value={option.value} label={option.label}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-2">
				<Label for="sort-direction">Sort direction</Label>
				<Select.Root type="single" name="sortDirection" bind:value={sortDirection}>
					<Select.Trigger class="w-full">
						{sortDirectionTriggerContent}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each sortDirectionOptions as option (option.value)}
								<Select.Item value={option.value} label={option.label}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-2">
				<Label for="hp-range">HP Range: {hpRange[0]}% - {hpRange[1]}%</Label>
				<Slider type="multiple" bind:value={hpRange} max={100} min={0} step={1} class="w-full" />
			</div>
			<div class="flex items-center space-x-2">
				<Switch id="hide-stale" bind:checked={hideStaleChannels} />
				<Label for="hide-stale">Hide stale channels</Label>
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
