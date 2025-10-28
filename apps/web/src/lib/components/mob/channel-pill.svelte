<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { HP_CRITICAL_THRESHOLD, HP_LOW_THRESHOLD } from '$lib/constants';

	let {
		channelNumber,
		status,
		hpPercentage,
		clickable = false,
		onclick
	}: {
		channelNumber: number;
		status: 'alive' | 'dead' | 'unknown';
		hpPercentage: number;
		clickable?: boolean;
		onclick?: () => void;
	} = $props();

	function getHPColorClass(hpPercentage: number, status: string) {
		if (status === 'dead') return 'dead';
		if (status === 'unknown') return 'unknown';
		if (hpPercentage <= 0) return 'dead';
		if (hpPercentage < HP_CRITICAL_THRESHOLD) return 'critical';
		if (hpPercentage < HP_LOW_THRESHOLD) return 'low';
		return 'healthy';
	}

	// Calculate fill width
	let hpColorClass = $derived(getHPColorClass(hpPercentage, status));
	let fillWidth = $derived(
		status === 'alive' && hpPercentage > 0
			? `${hpPercentage}%`
			: status === 'dead'
				? '100%'
				: status === 'unknown'
					? '100%'
					: '0%'
	);
</script>

{#if clickable}
	<Tooltip.Root disableHoverableContent>
		<Tooltip.Trigger {onclick}>
			{#snippet child({ props })}
				<button
					class="channel-pill cursor-pointer px-2 py-1 text-xs font-medium"
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							onclick?.();
						}
					}}
					tabindex="0"
					{...props}
				>
					<div class="hp-fill {hpColorClass}" style="width: {fillWidth}"></div>
					<span class="pill-text">{channelNumber}</span>
				</button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>{status === 'alive' ? `${hpPercentage}% HP` : status === 'dead' ? 'Dead' : 'Unknown'}</p>
		</Tooltip.Content>
	</Tooltip.Root>
{:else}
	<Tooltip.Root disableHoverableContent>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<div class="channel-pill px-2 py-1 text-xs font-medium" {...props}>
					<div class="hp-fill {hpColorClass}" style="width: {fillWidth}"></div>
					<span class="pill-text">{channelNumber}</span>
				</div>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>{status === 'alive' ? `${hpPercentage}% HP` : status === 'dead' ? 'Dead' : 'Unknown'}</p>
		</Tooltip.Content>
	</Tooltip.Root>
{/if}
