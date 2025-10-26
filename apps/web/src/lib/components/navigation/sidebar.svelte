<script lang="ts" module>
	import { Hammer, Medal, Sparkles, Swords } from '@lucide/svelte/icons';

	const data = {
		navMain: [
			{
				title: 'Bosses',
				url: '/',
				icon: Swords
			},
			{
				title: 'Magical Creatures',
				url: '/magical-creatures',
				icon: Sparkles
			},
			{
				title: 'Leaderboard - Coming Soon',
				url: '#leaderboard',
				icon: Medal,
				comingSoon: true
			},
			{
				title: 'Tools - Coming Soon',
				url: '#tools',
				icon: Hammer,
				comingSoon: true
			}
		]
	};
</script>

<script lang="ts">
	import NavigationMain from '$lib/components/navigation/main.svelte';
	import NavigationUser from '$lib/components/navigation/user.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { autoRefreshEnabled } from '$lib/stores/auto-refresh.svelte';
	import { mode, toggleMode } from 'mode-watcher';
	import type { ComponentProps } from 'svelte';

	// Reactive store value
	let isAutoRefreshEnabled = $derived($autoRefreshEnabled);

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	const sidebar = Sidebar.useSidebar();

	let isDark = $derived(mode.current === 'dark');
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header class="border-sidebar-border h-16 border-b">
		<NavigationUser />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavigationMain items={data.navMain} />
	</Sidebar.Content>
	<Sidebar.Footer class="p-4 {sidebar.state === 'collapsed' ? 'hidden' : ''}">
		{#if sidebar.state !== 'collapsed'}
			<div class="mb-4 flex items-center space-x-2">
				<Switch
					id="auto-refresh"
					onCheckedChange={(checked) => autoRefreshEnabled.set(checked)}
					checked={isAutoRefreshEnabled}
				/>
				<Label for="auto-refresh">Auto Refresh</Label>
			</div>
			<div class="mb-4 flex items-center space-x-2">
				<Switch id="dark-mode" onCheckedChange={toggleMode} checked={isDark} />
				<Label for="dark-mode">Dark Mode</Label>
			</div>
			<Separator class="mb-4" />
			<p class="text-center text-sm">Made by Wohee with ❤️</p>
		{/if}
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
