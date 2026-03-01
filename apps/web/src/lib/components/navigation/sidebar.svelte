<script lang="ts">
	import { resolve } from '$app/paths';
	import AnimatedGradientText from '$lib/components/animated-gradient-text.svelte';
	import InGameDay from '$lib/components/navigation/ingame-day.svelte';
	import NavigationMain from '$lib/components/navigation/main.svelte';
	import NavigationUser from '$lib/components/navigation/user.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { PAGES, PARTNER_PAGES, REGIONS } from '$lib/constants';
	import { adBlockStore } from '$lib/stores/ad-block.svelte';
	import { regionStore } from '$lib/stores/region.svelte';
	import { ShieldOff } from '@lucide/svelte/icons';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Content class="gap-0">
		<Sidebar.Group class="pb-0">
			<!-- Region Selection -->
			<div class="mb-2 group-data-[collapsible=icon]:hidden">
				<Tabs.Root bind:value={regionStore.value}>
					<Tabs.List class="h-8 w-full">
						{#each REGIONS as region (region.value)}
							<Tabs.Trigger value={region.value} class="h-6">{region.label}</Tabs.Trigger>
						{/each}
					</Tabs.List>
				</Tabs.Root>
			</div>

			<NavigationMain items={PAGES} />
		</Sidebar.Group>
		<Sidebar.Group class="py-0">
			<Sidebar.GroupLabel>Partners</Sidebar.GroupLabel>
			<NavigationMain items={PARTNER_PAGES} />
		</Sidebar.Group>
		<Sidebar.Group class="flex-1 group-data-[collapsible=icon]:hidden">
			<div class="pb-sb h-full"></div>
			{#if adBlockStore.value}
				<Alert.Root class="text-xs">
					<ShieldOff class="size-4" />
					<Alert.Title class="text-sm font-bold">Ad Blocked</Alert.Title>
					<Alert.Description class="text-xs">
						Consider disabling adblock to support this project and future development!
					</Alert.Description>
				</Alert.Root>
			{/if}
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer class="p-2 group-data-[collapsible=icon]:hidden">
		<div class="space-y-1.5 rounded-lg border bg-muted/40 p-2">
			<div class="flex items-center justify-between text-[0.7rem] text-muted-foreground">
				<span class="text-[0.65rem] tracking-wide uppercase">In-game</span>
				<InGameDay />
			</div>
			<NavigationUser />
			<div class="space-y-0.5 text-center text-[0.7rem] leading-snug text-muted-foreground">
				<p>
					Made by
					<a
						href="https://discordredirect.discordsafe.com/users/107391298171891712"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium"
					>
						<AnimatedGradientText>Wohee</AnimatedGradientText>
					</a>
					with ❤️
				</p>
				<p>
					<a
						href="https://ko-fi.com/wohee"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:underline"
					>
						Buy me a coffee ☕
					</a>
					<span class="mx-1">|</span>
					<a href={resolve('/privacy')} class="hover:underline">Privacy Policy</a>
				</p>
			</div>
		</div>
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
