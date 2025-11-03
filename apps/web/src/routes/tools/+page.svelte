<script lang="ts">
	import { page } from '$app/state';
	import ErrorBoundary from '$lib/components/error-boundary.svelte';
	import LinkCard from '$lib/components/link-card.svelte';
	import NavigationHeader from '$lib/components/navigation/header.svelte';
	import NavigationSidebar from '$lib/components/navigation/sidebar.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { TOOLS_SECTIONS } from '$lib/constants';
	import { Globe, Hammer, Monitor, Users } from '@lucide/svelte/icons';

	const canonicalUrl = `https://bptimer.com${page.url.pathname}`;
</script>

<SeoHead
	title="Tools & Resources | BP Timer"
	description="Community tools, DPS meters, websites, and Discord servers for Blue Protocol: Star Resonance. Essential resources for BPSR players."
	keywords="blue protocol tools, BPSR DPS meter, blue protocol discord, BPSR resources, community tools"
	{canonicalUrl}
/>

<svelte:boundary>
	<Sidebar.Provider>
		<NavigationSidebar />
		<Sidebar.Inset>
			<NavigationHeader />
			<div class="container mx-auto space-y-6 p-4">
				<PageHeader
					icon={Hammer}
					title="Tools & Resources"
					subtitle="Community tools, DPS meters, and helpful resources"
				/>

				<Tabs.Root value="officialTools" class="space-y-6">
					<Tabs.List class="grid w-full grid-cols-3">
						{#each Object.entries(TOOLS_SECTIONS) as [key, section] (key)}
							<Tabs.Trigger value={key} class="flex items-center gap-2">
								{#if key === 'officialTools'}
									<Monitor class="h-4 w-4" />
								{:else if key === 'communityDiscords'}
									<Users class="h-4 w-4" />
								{:else if key === 'communityWebsites'}
									<Globe class="h-4 w-4" />
								{/if}
								<span class="hidden md:inline">{section.title}</span>
								<span class="md:hidden">{section.shortTitle}</span>
							</Tabs.Trigger>
						{/each}
					</Tabs.List>

					{#each Object.entries(TOOLS_SECTIONS) as [key, section] (key)}
						<Tabs.Content value={key} class="space-y-6">
							{#if section.cards.length > 0}
								<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{#each section.cards as card (card.title)}
										<LinkCard
											title={card.title}
											description={card.description}
											author={card.author}
											badge={card.badge}
											badgeVariant={card.badgeVariant}
											driver={card.driver}
											tags={card.tags}
											previewImage={card.previewImage}
											url={card.url}
										/>
									{/each}
								</div>
							{/if}
						</Tabs.Content>
					{/each}
				</Tabs.Root>
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>

	{#snippet failed(error, reset)}
		<ErrorBoundary {error} {reset} />
	{/snippet}
</svelte:boundary>
