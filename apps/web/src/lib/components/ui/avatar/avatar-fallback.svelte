<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Avatar as AvatarPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AvatarPrimitive.FallbackProps = $props();
</script>

<AvatarPrimitive.Fallback
	bind:ref
	data-slot="avatar-fallback"
	class={cn('flex size-full items-center justify-center rounded-full bg-muted', className)}
	{...restProps}
/>
