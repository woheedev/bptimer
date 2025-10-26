<script lang="ts">
	import { eventTimersStore } from '$lib/stores/event-timers.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';

	const store = eventTimersStore;

	store.updateTimers();

	$effect(() => {
		const interval = setInterval(() => {
			store.updateTimers();
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<div class="bg-background border-b">
	<div class="flex items-center justify-between px-4 py-2">
		<Button
			variant="ghost"
			size="sm"
			class="flex items-center gap-2"
			onclick={() => store.toggleCollapsed()}
		>
			{#if store.isCollapsed}
				<ChevronDown class="h-4 w-4" />
			{:else}
				<ChevronUp class="h-4 w-4" />
			{/if}
			<span class="text-sm font-medium">Event Timers</span>
		</Button>
	</div>

	{#if !store.isCollapsed}
		<div class="grid grid-cols-2 gap-2 px-4 pb-3 md:grid-cols-3 lg:grid-cols-6">
			{#each store.timers as timer (timer.id)}
				<div
					class="flex items-center gap-2 rounded-lg border p-2 transition-colors {timer.id === 'daily-reset' || timer.id === 'weekly-reset'
						? 'border-border'
						: timer.isActive
							? 'border-green-500 bg-green-500/10'
							: 'border-red-500 bg-red-500/10'}"
				>
					<img src={timer.icon} alt={timer.name} class="h-auto w-6 shrink-0" />
					<div class="flex min-w-0 flex-col">
						<span class="truncate text-xs font-medium">{timer.name}</span>
						<span
							class="font-mono text-xs {timer.id === 'daily-reset' || timer.id === 'weekly-reset'
								? 'text-muted-foreground'
								: timer.isActive
									? 'text-green-600'
									: 'text-red-600'}"
						>
							{timer.countdown}{#if timer.isActive && timer.id !== 'daily-reset' && timer.id !== 'weekly-reset'}&nbsp;left{/if}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
