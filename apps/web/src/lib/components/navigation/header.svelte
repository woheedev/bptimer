<script lang="ts">
	import EventTimers from '$lib/components/navigation/event-timers.svelte';
	import SearchForm from '$lib/components/navigation/search.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { eventTimersStore } from '$lib/stores/event-timers.svelte';
	import { ChevronDown, ChevronUp } from '@lucide/svelte';
	import GitHubIcon from '@lucide/svelte/icons/github';
	import SidebarIcon from '@lucide/svelte/icons/sidebar';

	let { search }: { search?: { execute: (query: string) => void } } = $props();

	const sidebar = Sidebar.useSidebar();
</script>

<div class="bg-background sticky top-0 z-10">
	<header class="flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6">
		<Button class="size-8" variant="outline" size="icon" onclick={sidebar.toggle}>
			<SidebarIcon />
		</Button>
		<Button
			variant="outline"
			size="sm"
			class="flex items-center gap-2"
			onclick={() => eventTimersStore.toggleCollapsed()}
		>
			{#if eventTimersStore.isCollapsed}
				<ChevronDown class="h-4 w-4" />
			{:else}
				<ChevronUp class="h-4 w-4" />
			{/if}
			<span class="text-sm font-medium">Event Timers</span>
		</Button>
		<SearchForm {search} class="w-full sm:ml-auto sm:w-auto" />
		<Button
			href="https://github.com/woheedev/bptimer"
			variant="outline"
			size="icon"
			class="dark:text-foreground hidden sm:flex"
			target="_blank"
			rel="noopener noreferrer"
		>
			<GitHubIcon class="h-4 w-4" />
		</Button>
	</header>
	<EventTimers />
</div>
