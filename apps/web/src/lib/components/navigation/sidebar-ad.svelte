<script lang="ts">
	import { browser } from '$app/environment';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { ShieldOff } from '@lucide/svelte/icons';
	import { onMount } from 'svelte';

	let adElement: HTMLDivElement | null = $state(null);
	let adBlocked = $state(false);
	let adLoaded = $state(false);

	onMount(() => {
		if (!browser || !adElement) return;

		let mutationObserver: MutationObserver | null = null;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const cleanup = () => {
			mutationObserver?.disconnect();
			if (timeoutId) clearTimeout(timeoutId);
		};

		const checkForAd = () => {
			if (!adElement) return false;

			const iframe = adElement.querySelector('iframe');
			if (iframe) {
				const rect = iframe.getBoundingClientRect();
				if (rect.height > 0 && rect.width > 0) {
					return true;
				}
			}

			const rect = adElement.getBoundingClientRect();
			if (rect.height > 50) {
				return true;
			}

			return false;
		};

		const checkStatus = () => {
			if (!adElement) return;

			const style = window.getComputedStyle(adElement);

			// Check if ad blocker hid the element
			if (style.display === 'none' || style.visibility === 'hidden') {
				adBlocked = true;
				cleanup();
				return;
			}

			if (checkForAd()) {
				adLoaded = true;
				cleanup();
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
		}, 5000);

		return cleanup;
	});
</script>

<Alert.Root
	class="flex min-h-0 flex-1 overflow-hidden p-0 text-xs"
	style={adLoaded ? undefined : 'position: absolute; visibility: hidden; pointer-events: none;'}
>
	<div bind:this={adElement} class="block w-full" style="height:100%;">
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
