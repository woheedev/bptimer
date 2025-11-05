<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { ToolCard } from '$lib/types/ui';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	let {
		title,
		description,
		url,
		author,
		badge,
		badgeVariant = 'secondary',
		driver,
		tags,
		previewImage
	}: ToolCard = $props();
</script>

<Card.Root class="flex flex-col">
	{#if previewImage}
		<div class="relative h-32 w-full overflow-hidden rounded-t-lg">
			<img src={previewImage} alt={title} class="h-full w-full object-cover" />
		</div>
	{/if}
	<Card.Header class="relative pt-3 pb-2">
		{#if badge}
			<div class="absolute top-2 right-4">
				<Badge variant={badgeVariant} class="text-xs">{badge}</Badge>
			</div>
		{/if}
		<Card.Title class="leading-snug {badge ? 'max-w-[calc(100%-4rem)]' : ''}">{title}</Card.Title>
		{#if author}
			<p class="text-muted-foreground text-xs">by {author}</p>
		{/if}
	</Card.Header>
	<Card.Content class="flex-1 pt-0">
		<p class="text-muted-foreground text-xs">{description}</p>
	</Card.Content>
	<Card.Footer class="flex flex-col gap-2">
		{#if driver === 'npcap'}
			<a
				href="https://npcap.com/#download"
				target="_blank"
				rel="noopener noreferrer"
				class="self-start"
			>
				<Badge variant="destructive" class="text-xs">Requires Npcap</Badge>
			</a>
		{:else if driver === 'windivert'}
			<Badge variant="destructive" class="self-start text-xs">Uses WinDivert</Badge>
		{:else if driver === 'both'}
			<Badge variant="destructive" class="self-start text-xs">WinDivert / Npcap</Badge>
		{/if}
		{#if tags}
			<div class="flex flex-wrap gap-1 self-start">
				{#each tags.split('|') as tag (tag.trim())}
					<Badge variant="secondary" class="text-xs">{tag.trim()}</Badge>
				{/each}
			</div>
		{/if}
		<Button
			variant="outline"
			size="sm"
			class="mt-auto w-full gap-1.5"
			href={url}
			target="_blank"
			rel="noopener noreferrer"
		>
			Visit
			<ExternalLink class="h-3 w-3" />
		</Button>
	</Card.Footer>
</Card.Root>
