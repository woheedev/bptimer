<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import type { ToolCard } from '$lib/types/ui';
	import { formatTimeAgo } from '$lib/utils/general-utils';
	import Code from '@lucide/svelte/icons/code';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { onMount } from 'svelte';

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

	let lastRelease: string | null = $state(null);
	let isHovering = $state(false);
	let transformOrigin = $state('center center');

	const DRIVER_LABELS: Record<string, string> = {
		npcap: 'Npcap',
		windivert: 'WinDivert',
		both: 'Npcap / WinDivert'
	};

	const tagList = $derived(tags?.split('|').map((t) => t.trim()) ?? []);
	const driverLabel = $derived(driver ? DRIVER_LABELS[driver] : null);
	const hasStackInfo = $derived(tagList.length > 0 || driverLabel);

	function handleMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const padding = 0.15; // 15% inset
		const rawX = (e.clientX - rect.left) / rect.width;
		const rawY = (e.clientY - rect.top) / rect.height;
		const x = Math.min(100, Math.max(0, ((rawX - padding) / (1 - 2 * padding)) * 100));
		const y = Math.min(100, Math.max(0, ((rawY - padding) / (1 - 2 * padding)) * 100));
		transformOrigin = `${x}% ${y}%`;
	}

	onMount(async () => {
		const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
		if (!match) return;

		const response = await fetch(`https://api.github.com/repos/${match[1]}/releases/latest`).catch(
			() => null
		);
		if (!response?.ok) return;

		const data = await response.json();
		if (data?.published_at) {
			lastRelease = formatTimeAgo(data.published_at);
		}
	});
</script>

<Card.Root class="flex flex-col gap-0 overflow-hidden py-0">
	{#if previewImage}
		<div
			class="relative h-32 w-full overflow-hidden"
			onmouseenter={() => (isHovering = true)}
			onmouseleave={() => (isHovering = false)}
			onmousemove={handleMouseMove}
			role="img"
		>
			<img
				src={previewImage}
				alt={title}
				class="h-full w-full object-cover transition-transform duration-200"
				style:transform={isHovering ? 'scale(3)' : 'scale(1)'}
				style:transform-origin={transformOrigin}
			/>
			{#if badge}
				<Badge variant={badgeVariant} class="absolute top-2 right-2 text-xs">{badge}</Badge>
			{/if}
		</div>
	{/if}

	<Card.Header class="gap-0.5 px-3 py-2">
		<div class="flex min-w-0 items-start gap-2">
			<Card.Title class="min-w-0 flex-1 truncate text-sm">{title}</Card.Title>
			{#if badge && !previewImage}
				<Badge variant={badgeVariant} class="shrink-0 text-xs">{badge}</Badge>
			{/if}
		</div>
		{#if author}
			<Card.Description class="truncate text-xs">by {author}</Card.Description>
		{/if}
	</Card.Header>

	<Card.Content class="flex-1 px-3 pb-2">
		<p class="line-clamp-4 text-xs text-muted-foreground">{description}</p>
	</Card.Content>

	<Card.Footer class="flex-col items-stretch gap-2 px-3 pb-3">
		{#if lastRelease}
			<span class="text-xs text-muted-foreground">Last release: {lastRelease}</span>
		{/if}

		<div class="flex items-center gap-2">
			<Button
				variant="secondary"
				size="sm"
				class="flex-1 gap-1 text-xs"
				href={url}
				target="_blank"
				rel="noopener noreferrer"
			>
				View
				<ExternalLink class="h-3 w-3" />
			</Button>
			{#if hasStackInfo}
				<HoverCard.Root>
					<HoverCard.Trigger>
						<Button variant="secondary" size="sm" class="p-2" aria-label="View tech stack">
							<Code size={16} />
						</Button>
					</HoverCard.Trigger>
					<HoverCard.Content class="max-w-48">
						<div class="space-y-2">
							<h4 class="text-sm font-semibold">Tech Stack</h4>
							<div class="flex flex-wrap gap-1">
								{#if driverLabel}
									<Badge variant="destructive" class="text-xs">{driverLabel}</Badge>
								{/if}
								{#each tagList as tag (tag)}
									<Badge variant="secondary" class="text-xs">{tag}</Badge>
								{/each}
							</div>
						</div>
					</HoverCard.Content>
				</HoverCard.Root>
			{/if}
		</div>
	</Card.Footer>
</Card.Root>
