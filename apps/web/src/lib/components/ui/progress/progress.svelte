<script lang="ts">
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import { Progress as ProgressPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		max = 100,
		value,
		'aria-label': ariaLabel,
		...restProps
	}: WithoutChildrenOrChild<ProgressPrimitive.RootProps> & { 'aria-label'?: string } = $props();
</script>

<ProgressPrimitive.Root
	bind:ref
	data-slot="progress"
	class={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
	{value}
	{max}
	aria-label={ariaLabel}
	{...restProps}
>
	<div
		data-slot="progress-indicator"
		class="h-full w-full flex-1 bg-primary transition-all"
		style="transform: translateX(-{100 - (100 * (value ?? 0)) / (max ?? 1)}%)"
	></div>
</ProgressPrimitive.Root>
