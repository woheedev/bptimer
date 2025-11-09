<script lang="ts">
	import ChannelPill from '$lib/components/mob/channel-pill.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Toggle } from '$lib/components/ui/toggle';
	import {
		LATEST_CHANNELS_DISPLAY_COUNT,
		MAGICAL_CREATURE_RESET_HOURS,
		SECOND
	} from '$lib/constants';
	import { favoriteMobsStore } from '$lib/stores/favorite-mobs.svelte';
	import { formatCountdown } from '$lib/utils/event-timer';
	import {
		calculateRespawnProgress,
		getInitials,
		getNextRespawnTime
	} from '$lib/utils/general-utils';
	import { getMobImagePath } from '$lib/utils/mob-utils';
	import Heart from '@lucide/svelte/icons/heart';

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
			respawn_time?: number;
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

	const initials = $derived.by(() => getInitials(mob.name));

	// Compute pills array
	const channelPills = $derived.by(() => {
		const channelData = latestChannels.map((channel) => ({
			channelNumber: channel.channel,
			status: channel.status,
			hpPercentage: channel.hp_percentage
		}));

		const emptySlots = LATEST_CHANNELS_DISPLAY_COUNT - channelData.length;
		const emptyPills = Array.from({ length: Math.max(0, emptySlots) }, () => ({
			channelNumber: 0,
			status: 'unknown' as const,
			hpPercentage: 0
		}));

		return [...channelData, ...emptyPills];
	});

	const isFavorited = $derived.by(() => favoriteMobsStore.favoriteMobs.has(mob.id));

	// Respawn countdown logic
	const nextRespawnTime = $derived.by(() => {
		if (
			type === 'boss' ||
			MAGICAL_CREATURE_RESET_HOURS[mob.name as keyof typeof MAGICAL_CREATURE_RESET_HOURS]
		) {
			return getNextRespawnTime({
				name: mob.name,
				type,
				respawn_time: mob.respawn_time
			});
		}
		return null;
	});

	let countdownText = $state('');
	let progressValue = $state(0);

	// Update countdown every second
	$effect(() => {
		if (nextRespawnTime) {
			const updateCountdown = () => {
				const now = Date.now();
				const timeLeft = nextRespawnTime!.getTime() - now;

				if (timeLeft <= 0) {
					countdownText = 'Respawning...';
					progressValue = 100;
				} else {
					countdownText = formatCountdown(timeLeft);
					progressValue = calculateRespawnProgress(
						nextRespawnTime!,
						type as 'boss' | 'magical_creature',
						mob.name
					);
				}
			};

			updateCountdown();
			const interval = setInterval(updateCountdown, SECOND);
			return () => clearInterval(interval);
		}
	});
</script>

<Card.Root class="@container/card flex h-full flex-col justify-between gap-3">
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
		<!-- Progress bar area -->
		<div class="mt-2 flex h-6 flex-col justify-end">
			{#if nextRespawnTime}
				<div class="space-y-2">
					<div class="text-muted-foreground flex justify-between text-xs">
						<span>Time Until Respawn</span>
						<span>{countdownText}</span>
					</div>
					<Progress value={progressValue} class="h-2" aria-label="Time until {mob.name} respawn" />
				</div>
			{/if}
		</div>

		<!-- Latest 15 Reported Channels (5x3 Grid) -->
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

	<Card.Footer class="flex items-center justify-between gap-2 text-sm">
		<Button onclick={handleViewDetails} class="flex-1" variant="secondary" size="sm"
			>View Details</Button
		>
		<Toggle
			pressed={isFavorited}
			onPressedChange={() => favoriteMobsStore.toggleFavoriteMob(mob.id)}
			variant="outline"
			size="sm"
			class="p-2"
			aria-label={isFavorited
				? `Remove ${mob.name} from favorites`
				: `Add ${mob.name} to favorites`}
		>
			<Heart
				class={isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}
				size={16}
			/>
		</Toggle>
	</Card.Footer>
</Card.Root>
