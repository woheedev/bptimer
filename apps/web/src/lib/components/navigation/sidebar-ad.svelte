<script lang="ts">
	import { browser } from '$app/environment';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { ShieldOff } from '@lucide/svelte/icons';
	import { onMount } from 'svelte';

	const AD_CHECK_TIMEOUT_MS = 3000;

	type WindowWithAds = Window & { adsbygoogle?: unknown[] };

	let adElement: HTMLModElement | null = $state(null);
	let adBlocked = $state(false);
	let adUnfilled = $state(false);

	onMount(() => {
		if (!browser || !adElement) return;

		let mutationObserver: MutationObserver | null = null;
		let intervalId: ReturnType<typeof setInterval> | null = null;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const adsbygoogle = (window as WindowWithAds).adsbygoogle;

		const cleanup = () => {
			mutationObserver?.disconnect();
			if (intervalId) clearInterval(intervalId);
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
				adBlocked = true;
				cleanup();
				return;
			}

			const status = adElement.getAttribute('data-adsbygoogle-status');
			const adStatus = adElement.getAttribute('data-ad-status');

			if (status === 'done') {
				if (
					adStatus === 'unfilled' ||
					adStatus === 'unfill-optimized' ||
					!adElement.getAttribute('data-google-query-id')
				) {
					adUnfilled = true;
				}
				cleanup();
			}
		};

		try {
			if (!adsbygoogle) {
				adBlocked = true;
				return;
			}
			adsbygoogle.push({});
		} catch {
			adBlocked = true;
			return;
		}

		mutationObserver = new MutationObserver(checkStatus);
		mutationObserver.observe(adElement, {
			attributes: true,
			attributeFilter: ['data-adsbygoogle-status', 'data-ad-status']
		});

		intervalId = setInterval(checkStatus, 500);

		timeoutId = setTimeout(() => {
			checkStatus();
			cleanup();
		}, AD_CHECK_TIMEOUT_MS);

		return cleanup;
	});
</script>

<Alert.Root
	class="overflow-hidden p-0 text-xs"
	style="grid-template-columns: 1fr; min-height: 50px;{adBlocked || adUnfilled
		? ' display: none;'
		: ''}"
>
	<ins
		bind:this={adElement}
		class="adsbygoogle block w-full"
		style="display:block;min-height:50px;"
		data-ad-client="ca-pub-8392238124244371"
		data-ad-slot="3487180796"
		data-ad-format="auto"
		data-full-width-responsive="true"
	></ins>
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
