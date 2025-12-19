<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DrawerPrimitive.TitleProps = $props();
</script>

<DrawerPrimitive.Title
	bind:ref
	data-slot="drawer-title"
	class={cn('font-semibold text-foreground', className)}
	{...restProps}
/>
