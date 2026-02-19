<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Gift from '@lucide/svelte/icons/gift';
	import { BOSS_LOOT_DROPS } from '$lib/constants';

	let { mobName }: { mobName: string } = $props();

	const lootDrops = $derived(BOSS_LOOT_DROPS[mobName] || []);

	function parseItem(item: string): { rarity: string; itemType: string } {
		const parts = item.split('_');
		const rarity = parts[0];
		const itemType = parts.slice(1).join('_');
		return { rarity, itemType };
	}

	function getImagePath(itemType: string): string {
		return `/images/loot/${itemType}.webp`;
	}
</script>

{#if lootDrops.length > 0}
	<Popover.Root>
		<Popover.Trigger>
			<Button variant="secondary" size="sm" class="p-2" aria-label="View loot drops for {mobName}">
				<Gift size={16} />
			</Button>
		</Popover.Trigger>
		<Popover.Content side="top" class="w-auto pb-3">
			<div class="space-y-2">
				<h4 class="text-sm font-semibold">Gear Drops</h4>
				<div class="flex flex-wrap gap-2">
					{#each lootDrops as item (item)}
						{@const parsed = parseItem(item)}
						{@const borderClass =
							parsed.rarity === 'legendary' ? 'border-yellow-500' : 'border-purple-300'}
						<div
							class="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-sm border {borderClass}"
						>
							<img
								src={`/images/loot/${parsed.rarity}.webp`}
								alt=""
								role="presentation"
								class="absolute h-full w-full object-contain"
								loading="lazy"
								onerror={(e) => {
									(e.target as HTMLImageElement).style.display = 'none';
								}}
							/>
							<img
								src={getImagePath(parsed.itemType)}
								alt={`${parsed.rarity} ${parsed.itemType.replace(/_/g, ' ')}`}
								class="absolute z-10 h-full w-full object-contain"
								loading="lazy"
								onerror={(e) => {
									(e.target as HTMLImageElement).style.display = 'none';
								}}
							/>
						</div>
					{/each}
				</div>
			</div>
		</Popover.Content>
	</Popover.Root>
{/if}
