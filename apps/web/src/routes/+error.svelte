<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<svelte:head>
	<title>{page.status} - {page.error?.message || 'Error'} | BP Timer</title>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="text-center">
			<Card.Title class="text-destructive text-2xl font-bold">
				{page.status || 'Error'}
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4 text-center">
			<p class="text-muted-foreground">
				{page.error?.message || 'Something went wrong'}
			</p>
			<div class="flex justify-center gap-2">
				<Button onclick={() => window.history.back()} variant="outline">Go Back</Button>
				<Button onclick={() => goto(resolve('/'))}>Home</Button>
			</div>
		</Card.Content>
	</Card.Root>
</div>
