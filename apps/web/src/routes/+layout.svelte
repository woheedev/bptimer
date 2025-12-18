<script lang="ts">
	import { browser } from '$app/environment';
	import { Toaster } from '$lib/components/ui/sonner';
	import { pb } from '$lib/pocketbase';
	import type { UserRecordModel } from '$lib/types/auth';
	import { ModeWatcher } from 'mode-watcher';
	import { setContext } from 'svelte';
	import '../app.css';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';

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

	$effect(() => {
		if (!browser || page.url.pathname !== '/magical-creatures') {
			return;
		}
		toast.warning(
			'Website is being updated for multi-region support. Expect random downtime during these updates.',
			{
				duration: 10000,
				position: 'top-center'
			}
		);
	});

	setContext('token', getToken);
	setContext('user', getUser);
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
