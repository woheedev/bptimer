<script lang="ts">
	import { page } from '$app/state';
	import ErrorBoundary from '$lib/components/error-boundary.svelte';
	import LinkCard from '$lib/components/link-card.svelte';
	import NavigationHeader from '$lib/components/navigation/header.svelte';
	import NavigationSidebar from '$lib/components/navigation/sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { TOOLS_SECTIONS } from '$lib/constants';

	const canonicalUrl = `https://bptimer.com${page.url.pathname}`;
</script>

<svelte:head>
	<title>Tools & Resources | BP Timer</title>
	<meta
		name="description"
		content="Community tools, DPS meters, websites, and Discord servers for Blue Protocol: Star Resonance. Essential resources for BPSR players."
	/>
	<meta
		name="keywords"
		content="blue protocol tools, BPSR DPS meter, blue protocol discord, BPSR resources, community tools"
	/>

	<meta property="og:title" content="Tools & Resources | BP Timer" />
	<meta
		property="og:description"
		content="Community tools, DPS meters, websites, and Discord servers for Blue Protocol: Star Resonance."
	/>
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />

	<meta name="twitter:title" content="Tools & Resources | BP Timer" />
	<meta
		name="twitter:description"
		content="Community tools, DPS meters, websites, and Discord servers for Blue Protocol: Star Resonance."
	/>

	<link rel="canonical" href={canonicalUrl} />
</svelte:head>

<svelte:boundary>
	<Sidebar.Provider>
		<NavigationSidebar />
		<Sidebar.Inset>
			<NavigationHeader />
			<div class="flex flex-1 flex-col">
				<div class="@container/main flex flex-col gap-2">
					<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						<div class="px-4 lg:px-6">
							<h1 class="text-3xl font-bold">Tools & Resources</h1>
						</div>

						{#each Object.values(TOOLS_SECTIONS) as section (section.title)}
							{#if section.cards.length > 0}
								<section class="space-y-3">
									<div class="px-4 lg:px-6">
										<h2 class="text-2xl font-bold">{section.title}</h2>
										{#if section.subtitle}
											<p class="text-muted-foreground mt-1 text-sm">{section.subtitle}</p>
										{/if}
									</div>
									<div
										class="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3 lg:px-6 xl:grid-cols-4"
									>
										{#each section.cards as card (card.title)}
											<LinkCard
												title={card.title}
												description={card.description}
												author={card.author}
												badge={card.badge}
												badgeVariant={card.badgeVariant}
												npcap={card.npcap}
												tags={card.tags}
												previewImage={card.previewImage}
												url={card.url}
											/>
										{/each}
									</div>
								</section>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>

	{#snippet failed(error, reset)}
		<ErrorBoundary {error} {reset} />
	{/snippet}
</svelte:boundary>
