<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';

	const meters = [
		{
			name: 'BPTimer Companion',
			version: '0.2.0+',
			url: 'https://github.com/woheedev/bptimer/releases/latest'
		},
		{
			name: 'ZDPS',
			version: '0.1.6.2+',
			url: 'https://github.com/Blue-Protocol-Source/BPSR-ZDPS/releases/latest'
		},
		{
			name: 'BPSR-Logs',
			version: '0.24.0+',
			url: 'https://github.com/winjwinj/bpsr-logs/releases/latest'
		}
	];
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="mt-5 grid grid-cols-[1fr_auto] items-center justify-items-end gap-y-1">
	{#each meters as meter (meter.name)}
		<a
			href={meter.url}
			target="_blank"
			rel="noopener noreferrer"
			class="justify-self-start text-sm underline-offset-2 hover:underline"
		>
			{meter.name}
		</a>
		<Badge variant="outline" class="font-mono text-[11px]">{meter.version}</Badge>
	{/each}
	<span class="justify-self-start text-sm opacity-50">Others</span>
	<Badge variant="outline" class="text-[11px] opacity-50">Pending fix</Badge>
</div>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
