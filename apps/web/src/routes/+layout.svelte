<script lang="ts">
	import { browser } from '$app/environment';
	import { Toaster } from '$lib/components/ui/sonner';
	import { pb } from '$lib/pocketbase';
	import type { UserRecordModel } from '$lib/types/auth';
	import { AD_CHECK_DELAY } from '$lib/constants';
	import { adBlockStore } from '$lib/stores/ad-block.svelte';
	import { showToast } from '$lib/utils/toast';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount, setContext } from 'svelte';
	import '../app.css';

	const METER_BREAKING_NOTICE_KEY = 'bptimer:meter-breaking-notice-v1';
	const MEDIAVINE_SCRIPT_URL =
		'https://scripts.pubnation.com/tags/7347f077-bb36-48d4-a90b-3128776c43b3.js';

	let { children } = $props();

	let token = $state<string>(browser ? pb.authStore.token : '');
	let user = $state<UserRecordModel | null>(
		browser ? (pb.authStore.record as UserRecordModel) : null
	);

	let authRefreshRan = $state(false);

	const getUser = () => user;
	const getToken = () => token;

	$effect(() => {
		const unsubscribe = pb.authStore.onChange((newToken, model) => {
			token = newToken;
			user = model as UserRecordModel;
			if (model) {
				localStorage.setItem('hasSignedIn', 'true');
			} else {
				localStorage.removeItem('hasSignedIn');
			}
		}, true);
		return () => {
			unsubscribe();
		};
	});

	// Refresh auth on mount to get latest user data
	// Also handles session expiration
	$effect(() => {
		if (!browser || !pb.authStore.isValid || authRefreshRan) return;

		authRefreshRan = true;
		pb.collection('users')
			.authRefresh()
			.catch((error) => {
				console.error('Auth refresh failed:', error);
				if (error?.status === 401 || error?.status === 403) {
					pb.authStore.clear();
				}
			});
	});

	setContext('token', getToken);
	setContext('user', getUser);

	onMount(() => {
		if (browser && !sessionStorage.getItem(METER_BREAKING_NOTICE_KEY)) {
			showToast.warning(
				'Due to breaking changes from the latest game update, make sure your meter is updated to the latest version.',
				{
					duration: 12000,
					description: 'BPTimer Companion: 0.2.0+\nZDPS: 0.1.6.2+\nOthers: Pending fix'
				}
			);
			sessionStorage.setItem(METER_BREAKING_NOTICE_KEY, '1');
		}

		if (document.querySelector(`script[src="${MEDIAVINE_SCRIPT_URL}"]`)) return;

		let loaded = false;
		const script = document.createElement('script');
		script.async = true;
		script.setAttribute('data-noptimize', '1');
		script.setAttribute('data-cfasync', 'false');
		script.src = MEDIAVINE_SCRIPT_URL;
		script.onload = () => {
			loaded = true;
			adBlockStore.value = false;
		};
		script.onerror = () => {
			adBlockStore.value = true;
		};
		document.head.appendChild(script);

		const timeout = setTimeout(() => {
			if (!loaded) adBlockStore.value = true;
		}, AD_CHECK_DELAY);

		return () => clearTimeout(timeout);
	});
</script>

<svelte:head>
	<!-- Default meta tags -->
	<meta
		name="description"
		content="Track boss spawns, magical creature spawns, and event timers in Blue Protocol: Star Resonance. Real-time community-driven tracking."
	/>
	<meta
		name="keywords"
		content="blue protocol, blue protocol timer, boss timer, spawn tracker, BPSR, Blue Protocol Star Resonance, mob tracker, event timer, magical creatures"
	/>
	<meta name="author" content="Wohee" />
	<meta name="robots" content="index, follow" />
</svelte:head>

<!-- Page content -->
<main class="flex-1">
	<ModeWatcher defaultMode="dark" />
	<Toaster position="top-center" />
	{@render children()}
</main>
