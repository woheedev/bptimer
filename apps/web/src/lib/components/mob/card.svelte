<script lang="ts">
	import ChannelPill from '$lib/components/mob/channel-pill.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { DEAD_HP_VALUE, LATEST_CHANNELS_DISPLAY_COUNT } from '$lib/constants';
	import { getInitials } from '$lib/utils/general-utils';
	import { getMobImagePath } from '$lib/utils/mob-utils';

	let {
		mob,
		latestChannels = [],
		onViewDetails,
		onChannelClick,
		type = 'boss'
	}: {
		mob: {
			id: string;
			name: string;
			uid: number;
			total_channels: number;
		};
		latestChannels?: Array<{
			channel: number;
			status: 'alive' | 'dead' | 'unknown';
			hp_percentage: number;
			last_updated: string;
		}>;
		onViewDetails?: (mobId: string, mobName: string, mobUid: number, totalChannels: number) => void;
		onChannelClick?: (
			mobId: string,
			mobName: string,
			mobUid: number,
			totalChannels: number,
			channel: number
		) => void;
		type?: 'boss' | 'magical_creature' | string;
	} = $props();

	function handleViewDetails() {
		onViewDetails?.(mob.id, mob.name, mob.uid, mob.total_channels);
	}

	let initials = $derived.by(() => getInitials(mob.name));

	// Compute pills array
	let channelPills = $derived.by(() => {
		const activePills = latestChannels
			.filter((channel) => channel.hp_percentage > DEAD_HP_VALUE) // Filter out dead channels (0 HP)
			.map((channel) => ({
				channelNumber: channel.channel,
				status: channel.status,
				hpPercentage: channel.hp_percentage
			}));

		// Fill remaining slots with empty unknown pills
		const emptySlots = LATEST_CHANNELS_DISPLAY_COUNT - activePills.length;
		const emptyPills = Array.from({ length: Math.max(0, emptySlots) }, () => ({
			channelNumber: 0,
			status: 'unknown' as const,
			hpPercentage: 0
		}));

		return [...activePills, ...emptyPills];
	});
</script>

<Card.Root class="@container/card flex h-full flex-col justify-between">
	<Card.Header>
		<Card.Title class="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
			{mob.name}
		</Card.Title>
		<Card.Action>
			<Avatar.Root class="h-16 w-16">
				<Avatar.Image src={getMobImagePath(type, mob.name)} alt={mob.name} />
				<Avatar.Fallback class="bg-red-500 text-lg font-bold text-white">
					{initials}
				</Avatar.Fallback>
			</Avatar.Root>
		</Card.Action>
	</Card.Header>

	<Card.Content class="space-y-4">
		<!-- Latest 25 Reported Channels (5x5 Grid) -->
		<div class="grid grid-cols-5 justify-center gap-2">
			{#each channelPills as pill, index (index)}
				<ChannelPill
					channelNumber={pill.channelNumber}
					status={pill.status}
					hpPercentage={pill.hpPercentage}
					clickable={pill.channelNumber > 0}
					onclick={pill.channelNumber > 0
						? () =>
								onChannelClick?.(mob.id, mob.name, mob.uid, mob.total_channels, pill.channelNumber)
						: undefined}
				/>
			{/each}
		</div>
	</Card.Content>

	<Card.Footer class="flex-col items-start gap-1.5 text-sm">
		<Button onclick={handleViewDetails} class="w-full" variant="secondary">View Details</Button>
	</Card.Footer>
</Card.Root>
