<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	interface Props {
		error: unknown;
		reset: () => void;
	}

	let { error, reset }: Props = $props();
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="text-center">
		<h1 class="text-destructive mb-4 text-2xl font-bold">Something went wrong</h1>
		<p class="text-muted-foreground mb-4">
			{error instanceof Error ? error.message : 'An unexpected error occurred'}
		</p>
		<Button onclick={reset}>Try again</Button>
	</div>
</div>
