<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { PageItem } from '$lib/types/ui';

	let {
		items
	}: {
		items: PageItem[];
	} = $props();
</script>

<Sidebar.GroupContent class="flex flex-col gap-2">
	<Sidebar.Menu>
		{#each items as item (item.title)}
			{@const isActive = !item.external && !item.comingSoon && page.url.pathname === item.url}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					tooltipContent={item.title}
					variant={item.variant || 'default'}
					{isActive}
					{...item.comingSoon ? { disabled: true } : {}}
					onclick={item.comingSoon
						? undefined
						: item.external
							? () => window.open(item.url, '_blank')
							: // eslint-disable-next-line svelte/no-navigation-without-resolve
								() => goto(item.url)}
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
