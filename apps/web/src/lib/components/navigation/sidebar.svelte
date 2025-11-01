<script lang="ts">
	import AnimatedGradientText from '$lib/components/animated-gradient-text.svelte';
	import InGameDay from '$lib/components/navigation/ingame-day.svelte';
	import NavigationMain from '$lib/components/navigation/main.svelte';
	import NavigationUser from '$lib/components/navigation/user.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { PAGES, PARTNER_PAGES } from '$lib/constants';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	const sidebar = Sidebar.useSidebar();
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header class="border-sidebar-border h-16 justify-center border-b">
		<NavigationUser />
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<NavigationMain items={PAGES} />
			<div class={sidebar.state === 'collapsed' ? 'hidden' : ''}>
				<div class="flex items-center gap-2 px-2 py-2">
					<InGameDay />
				</div>
			</div>
		</Sidebar.Group>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Partner Sites</Sidebar.GroupLabel>
			<NavigationMain items={PARTNER_PAGES} />
		</Sidebar.Group>
		<Sidebar.Group class={sidebar.state === 'collapsed' ? 'hidden' : ''}>
			<div class="px-2 py-2">
				<Alert.Root class="text-xs">
					<Alert.Title class="text-xs">System Updates</Alert.Title>
					<Alert.Description class="text-xs leading-relaxed">
						Sorry for any temporary outages or delays as I work on implementing new features.
					</Alert.Description>
				</Alert.Root>
			</div>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer class="p-4 {sidebar.state === 'collapsed' ? 'hidden' : ''}">
		{#if sidebar.state !== 'collapsed'}
			<div class="mb-4">
				<Sidebar.MenuButton
					tooltipContent="Join Discord"
					variant="outline"
					href="https://discord.gg/3UTC4pfCyC"
					target="_blank"
					rel="noopener noreferrer"
					class="w-full justify-center"
				>
					<img src="https://cdn.simpleicons.org/discord/white" alt="Discord" class="h-4 w-4" />
					<span>Join Discord</span>
				</Sidebar.MenuButton>
			</div>
			<p class="text-center text-sm">
				Made by <a
					href="https://discordredirect.discordsafe.com/users/107391298171891712"
					target="_blank"
					rel="noopener noreferrer"><AnimatedGradientText>Wohee</AnimatedGradientText></a
				> with ❤️
			</p>
			<p class="text-center text-xs">
				<a
					href="https://ko-fi.com/wohee"
					target="_blank"
					rel="noopener noreferrer"
					class="hover:underline"
				>
					Buy me a coffee ☕
				</a>
			</p>
		{/if}
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
