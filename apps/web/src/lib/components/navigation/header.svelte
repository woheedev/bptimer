<script lang="ts">
	import EventTimers from '$lib/components/navigation/event-timers.svelte';
	import SearchForm from '$lib/components/navigation/search.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { eventTimersStore } from '$lib/stores/event-timers.svelte';
	import { ChevronDown, ChevronUp } from '@lucide/svelte';
	import GitHubIcon from '@lucide/svelte/icons/github';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SidebarIcon from '@lucide/svelte/icons/sidebar';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { toggleMode } from 'mode-watcher';

	let { search }: { search?: { execute: (query: string) => void } } = $props();

	const sidebar = Sidebar.useSidebar();
</script>

<div class="bg-background sticky top-0 z-10">
	<header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
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
		<Button onclick={toggleMode} variant="outline" size="icon-sm" class="hidden sm:flex">
			<SunIcon class="scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90" />
			<MoonIcon class="absolute scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0" />
			<span class="sr-only">Toggle theme</span>
		</Button>
		<Button
			href="https://github.com/woheedev/bptimer"
			variant="outline"
			size="icon-sm"
			class="dark:text-foreground hidden sm:flex"
			target="_blank"
			rel="noopener noreferrer"
		>
			<GitHubIcon class="h-4 w-4" />
		</Button>
	</header>
	<EventTimers />
</div>
