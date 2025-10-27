<script lang="ts">
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
					href={item.comingSoon ? undefined : item.url}
					target={item.external ? '_blank' : undefined}
					rel={item.external ? 'noopener noreferrer' : undefined}
					aria-disabled={item.comingSoon ? true : undefined}
					onclick={item.comingSoon
						? (e) => {
								e.preventDefault();
							}
						: undefined}
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
