<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { searchQuerySchema } from '$lib/schemas';
	import type { WithElementRef } from '$lib/utils.js';
	import Search from '@lucide/svelte/icons/search';
	import type { HTMLFormAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		search,
		...restProps
	}: WithElementRef<HTMLFormAttributes> & {
		search?: { execute: (query: string) => void };
	} = $props();

	function handleInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const value = input.value;

		try {
			const validatedQuery = searchQuerySchema.parse(value);
			search?.execute(validatedQuery);
		} catch (error) {
			// Invalid search query - could show validation error or ignore
			console.warn('Invalid search query:', error);
			// Optionally clear invalid input or show error state
		}
	}
</script>

<form {...restProps} bind:this={ref}>
	<div class="relative">
		<Label for="search" class="sr-only">Search</Label>
		<Sidebar.Input
			id="search"
			placeholder="Type to search..."
			class="h-8 pl-7"
			oninput={handleInput}
		/>
		<Search
			class="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none"
		/>
	</div>
</form>
