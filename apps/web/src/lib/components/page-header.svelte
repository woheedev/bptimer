<script lang="ts">
	import type { PageHeaderProps } from '$lib/types/components';

	let { icon: IconComponent, title, subtitle }: PageHeaderProps = $props();
</script>

<div class="flex items-center gap-3">
	<IconComponent class="h-8 w-8" />
	<div>
		<h1 class="text-3xl font-bold">{title}</h1>
		{#if subtitle}
			<p class="text-muted-foreground">{subtitle}</p>
		{/if}
	</div>
</div>
