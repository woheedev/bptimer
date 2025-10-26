<script lang="ts">
	import { browser } from '$app/environment';
	import DpsMeterToast from '$lib/components/dps-meter-toast.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { DPS_METER_TOAST_DURATION } from '$lib/constants';
	import { pb } from '$lib/pocketbase';
	import type { UserRecordModel } from '$types/auth';
	import { ModeWatcher } from 'mode-watcher';
	import { setContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import '../app.css';

	let { children } = $props();

	let token = $state<string>(browser ? pb.authStore.token : '');
	let user = $state<UserRecordModel | null>(
		browser ? (pb.authStore.record as UserRecordModel) : null
	);

	const getUser = () => user;
	const getToken = () => token;

	$effect(() => {
		const unsubscribe = pb.authStore.onChange((newToken, model) => {
			token = newToken;
			user = model as UserRecordModel;
			if (model) {
				localStorage.setItem('hasSignedIn', 'true');
			}
		}, true);
		return () => {
			unsubscribe();
		};
	});

	$effect(() => {
		if (browser) {
			toast(DpsMeterToast, { duration: DPS_METER_TOAST_DURATION });
		}
	});

	setContext('token', getToken);
	setContext('user', getUser);
</script>

<!-- Page content -->
<main class="flex-1">
	<ModeWatcher defaultMode="dark" />
	<Toaster />
	{@render children()}
</main>
