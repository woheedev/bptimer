<script lang="ts">
	import AnimatedGradientText from '$lib/components/animated-gradient-text.svelte';
	import InGameDay from '$lib/components/navigation/ingame-day.svelte';
	import NavigationMain from '$lib/components/navigation/main.svelte';
	import NavigationUser from '$lib/components/navigation/user.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { PAGES, PARTNER_PAGES } from '$lib/constants';
	import { HeartHandshake } from '@lucide/svelte/icons';
	import { siDiscord } from 'simple-icons';
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
	<Sidebar.Content class="gap-0">
		<Sidebar.Group class="pb-0">
			<NavigationMain items={PAGES} />
			<div class={sidebar.state === 'collapsed' ? 'hidden' : ''}>
				<div class="flex items-center gap-2 py-2">
					<InGameDay />
				</div>
			</div>
		</Sidebar.Group>
		<Sidebar.Group class="py-0">
			<Sidebar.GroupLabel>Partner Sites</Sidebar.GroupLabel>
			<NavigationMain items={PARTNER_PAGES} />
		</Sidebar.Group>
		<Sidebar.Group class={sidebar.state === 'collapsed' ? 'hidden' : ''}>
			<div class="flex flex-col gap-2 p-0">
				<!-- Downtime Alert
				<Alert.Root class="text-xs">
					<Construction />
					<Alert.Title class="text-sm font-bold">System Updates</Alert.Title>
					<Alert.Description class="text-xs">
						Sorry for any temporary outages or delays while I work on implementing new features.
					</Alert.Description>
				</Alert.Root>
				-->
				<Alert.Root class="text-xs">
					<HeartHandshake />
					<Alert.Title class="text-sm font-bold">Looking to Collaborate?</Alert.Title>
					<Alert.Description class="text-xs">
						We're welcoming developers and partners to help grow the project. Join our Discord to
						get involved.
					</Alert.Description>
				</Alert.Root>
			</div>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer class="px-2 pt-2 pb-4 {sidebar.state === 'collapsed' ? 'hidden' : ''}">
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
					<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
						><path d={siDiscord.path} /></svg
					>
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
					Buy me a coffee ☕ | v0.10.3
				</a>
			</p>
		{/if}
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
