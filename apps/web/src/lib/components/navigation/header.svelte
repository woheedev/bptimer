<script lang="ts">
	import EventTimers from '$lib/components/navigation/event-timers.svelte';
	import SearchForm from '$lib/components/navigation/search.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import GitHubIcon from '@lucide/svelte/icons/github';
	import SidebarIcon from '@lucide/svelte/icons/sidebar';

	let { search }: { search?: { execute: (query: string) => void } } = $props();

	const sidebar = Sidebar.useSidebar();
</script>

<div class="bg-background sticky top-0 z-10">
	<header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
		<div class="flex h-(--header-height) w-full items-center gap-2 px-4">
			<Button class="size-8" variant="ghost" size="icon" onclick={sidebar.toggle}>
				<SidebarIcon />
			</Button>
			<Button
				href="https://github.com/winjwinj/bpsr-logs/releases/latest"
				variant="default"
				size="sm"
				class="mx-auto sm:mx-2"
				target="_blank"
				rel="noopener noreferrer"
			>
				Download DPS Meter
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
		</div>
	</header>
	<EventTimers />
</div>
