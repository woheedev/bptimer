<script lang="ts">
	import { browser } from '$app/environment';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { ShieldOff } from '@lucide/svelte/icons';
	import { onMount } from 'svelte';

	let adElement: HTMLDivElement | null = $state(null);
	let adBlocked = $state(false);
	let adUnfilled = $state(false);

	onMount(() => {
		if (!browser || !adElement) return;

		let mutationObserver: MutationObserver | null = null;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const cleanup = () => {
			mutationObserver?.disconnect();
			if (timeoutId) clearTimeout(timeoutId);
		};

		const checkStatus = () => {
			if (!adElement) return;

			const style = window.getComputedStyle(adElement);
			const rect = adElement.getBoundingClientRect();

			if (rect.height === 0 || rect.width === 0 || style.display === 'none') {
				adBlocked = true;
				cleanup();
				return;
			}

			if (adElement.children.length === 0) {
				adUnfilled = true;
				cleanup();
				return;
			}
		};

		mutationObserver = new MutationObserver(checkStatus);
		mutationObserver.observe(adElement, {
			childList: true,
			subtree: true,
			attributes: true
		});

		timeoutId = setTimeout(() => {
			checkStatus();
			cleanup();
		}, 3000);

		return cleanup;
	});
</script>

<Alert.Root
	class="flex min-h-0 flex-1 overflow-hidden p-0 text-xs"
	style={adBlocked || adUnfilled ? 'display: none;' : undefined}
>
	<div bind:this={adElement} class="block w-full" style="height:100%;min-height:50px;">
		<div class="content_desktop_hint"></div>
	</div>
</Alert.Root>

{#if adBlocked}
	<Alert.Root class="text-xs">
		<ShieldOff />
		<Alert.Title class="text-sm font-bold">Ad Blocked :(</Alert.Title>
		<Alert.Description class="text-xs">
			Consider disabling adblock to support this project and future development!
		</Alert.Description>
	</Alert.Root>
{/if}
