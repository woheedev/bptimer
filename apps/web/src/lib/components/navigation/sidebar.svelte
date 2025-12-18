<script lang="ts">
	import AnimatedGradientText from '$lib/components/animated-gradient-text.svelte';
	import Discord from '$lib/components/icons/discord.svelte';
	import InGameDay from '$lib/components/navigation/ingame-day.svelte';
	import NavigationMain from '$lib/components/navigation/main.svelte';
	import SidebarAd from '$lib/components/navigation/sidebar-ad.svelte';
	import NavigationUser from '$lib/components/navigation/user.svelte';
	// import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { PAGES, PARTNER_PAGES, REGIONS } from '$lib/constants';
	import { regionStore } from '$lib/stores/region.svelte';
	// import { HeartHandshake } from '@lucide/svelte/icons';
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
			<!-- Region Selection -->
			<div class="mb-2 {sidebar.state === 'collapsed' ? 'hidden' : ''}">
				<Tabs.Root bind:value={regionStore.value}>
					<Tabs.List class="h-8 w-full">
						{#each REGIONS as region (region.value)}
							<Tabs.Trigger value={region.value} class="h-6 ">{region.label}</Tabs.Trigger>
						{/each}
					</Tabs.List>
				</Tabs.Root>
			</div>

			<NavigationMain items={PAGES} />
			<div class={sidebar.state === 'collapsed' ? 'hidden' : ''}>
				<div class="flex items-center gap-2 py-2">
					<InGameDay />
				</div>
			</div>
		</Sidebar.Group>
		<Sidebar.Group class="py-0">
			<Sidebar.GroupLabel>Partners</Sidebar.GroupLabel>
			<NavigationMain items={PARTNER_PAGES} />
		</Sidebar.Group>
		<Sidebar.Group class="flex-1 {sidebar.state === 'collapsed' ? 'hidden' : ''}">
			<div class="flex h-full flex-col gap-2 p-0">
				<!--
				<Alert.Root class="text-xs">
					<HeartHandshake />
					<Alert.Title class="text-sm font-bold">Looking to Collaborate?</Alert.Title>
					<Alert.Description class="text-xs">
						Use our API client to help crowdsource data. Join our Discord below for an API key or
						more information. <a
							href="https://github.com/woheedev/bptimer/tree/main/packages/bptimer-api-client"
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:no-underline">Click here!</a
						>
					</Alert.Description>
				</Alert.Root>
				-->
				<SidebarAd />
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
					<Discord />
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
					Buy me a coffee ☕ | v1.4.0
				</a>
			</p>
		{/if}
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
