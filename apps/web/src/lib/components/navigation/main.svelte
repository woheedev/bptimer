<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { Component } from 'svelte';
	let {
		items
	}: { items: { title: string; url: string; icon?: Component; comingSoon?: boolean }[] } = $props();
</script>

<Sidebar.Group>
	<Sidebar.GroupContent class="flex flex-col gap-2">
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						tooltipContent={item.title}
						{...item.comingSoon ? { disabled: true } : {}}
						onclick={item.comingSoon ? undefined : () => goto(item.url)}
					>
						{#if item.icon}
							<item.icon />
						{/if}
						<span>{item.title}</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
