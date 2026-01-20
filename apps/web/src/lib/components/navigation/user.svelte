<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Skeleton from '$lib/components/ui/skeleton/index.js';
	import { signIn, signOut } from '$lib/oauth';
	import type { UserRecordModel } from '$lib/types/auth';
	import { getInitials } from '$lib/utils/general-utils';
	import { getAvatarUrl } from '$lib/utils/user-utils';
	import { LogIn, LogOut } from '@lucide/svelte/icons';
	import { getContext } from 'svelte';

	// Loading state for auth check
	let authLoading = $state(true);

	// Get user from layout context
	const getUser = getContext<() => UserRecordModel | null>('user');
	const user = $derived(getUser());

	$effect(() => {
		if (browser) {
			authLoading = false;
		}
	});

	const initials = $derived(getInitials(user?.username || ''));

	// Construct avatar URL for PocketBase file field
	const avatarUrl = $derived(browser && user ? getAvatarUrl(user) || '' : '');

	async function handleSignIn(): Promise<void> {
		await signIn();
	}

	async function handleSignOut(): Promise<void> {
		await signOut();
		await goto(resolve('/'));
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		{#if authLoading}
			<Sidebar.MenuButton
				size="lg"
				class="h-10 items-center gap-2 rounded-lg border bg-sidebar-accent/15 px-2 text-[0.75rem]"
			>
				<Skeleton.Skeleton class="size-6 rounded-lg" />
				<div class="grid flex-1 text-left leading-tight">
					<Skeleton.Skeleton class="mb-1 h-2.5 w-20" />
					<Skeleton.Skeleton class="h-2 w-16" />
				</div>
				<div class="h-6 w-12 rounded border"></div>
			</Sidebar.MenuButton>
		{:else if user}
			<Sidebar.MenuButton
				size="lg"
				class="h-10 items-center gap-2 rounded-lg border bg-sidebar-accent/15 px-2 text-[0.75rem]"
			>
				<Avatar.Root class="size-6 rounded-lg">
					<Avatar.Image src={avatarUrl} alt={`${user.username}'s avatar`} />
					<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
				</Avatar.Root>
				<div class="min-w-0 flex-1 text-left leading-tight">
					<p class="truncate text-[0.8rem] font-medium">{user.username}</p>
					<p class="truncate text-[0.7rem] text-muted-foreground/90">Rep: {user.reputation ?? 0}</p>
				</div>
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground hover:bg-muted/70"
					onclick={(event) => {
						event.preventDefault();
						handleSignOut();
					}}
					aria-label="Log out"
				>
					<LogOut class="size-3" />
					Log out
				</button>
			</Sidebar.MenuButton>
		{:else}
			<Sidebar.MenuButton
				size="lg"
				class="h-10 items-center gap-2 rounded-lg border bg-muted/50 px-2 text-[0.8rem]"
				href="#"
				onclick={(e) => {
					e.preventDefault();
					handleSignIn();
				}}
			>
				<div class="flex min-w-0 flex-1 items-center gap-2">
					<div
						class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted-foreground/10"
					>
						<LogIn class="size-4" />
					</div>
					<p class="truncate font-semibold">Login to submit reports</p>
				</div>
			</Sidebar.MenuButton>
		{/if}
	</Sidebar.MenuItem>
</Sidebar.Menu>
