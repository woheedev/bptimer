<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
		speed?: number;
		colorFrom?: string;
		colorTo?: string;
	}

	let {
		children,
		class: className,
		speed = 1,
		colorFrom = 'oklch(0.56 0.24 260.92)',
		colorTo = 'oklch(0.69 0.17 255.59)'
	}: Props = $props();
</script>

<span
	style="--bg-size: {speed *
		300}%; --color-from: {colorFrom}; --color-to: {colorTo}; animation: gradient 8s linear infinite;"
	class={cn(
		'inline-block bg-linear-to-r from-(--color-from) via-(--color-to) to-(--color-from) bg-size-[var(--bg-size)_100%] bg-clip-text text-transparent transition-all duration-200 hover:-translate-y-1 hover:scale-105',
		className
	)}
>
	{@render children()}
</span>
