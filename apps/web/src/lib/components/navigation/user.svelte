<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import * as Skeleton from '$lib/components/ui/skeleton/index.js';
	import { signIn, signOut } from '$lib/oauth';
	import type { UserRecordModel } from '$lib/types/auth';
	import { getInitials } from '$lib/utils/general-utils';
	import { getAvatarUrl } from '$lib/utils/user-utils';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import { getContext } from 'svelte';

	const sidebar = useSidebar();

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
			<Sidebar.MenuButton size="lg">
				<Skeleton.Skeleton class="size-8 rounded-lg" />
				<div class="grid flex-1 text-left text-sm leading-tight">
					<Skeleton.Skeleton class="mb-1 h-4 w-20" />
					<Skeleton.Skeleton class="h-3 w-16" />
				</div>
			</Sidebar.MenuButton>
		{:else if user}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Sidebar.MenuButton
							size="lg"
							class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							{...props}
						>
							<Avatar.Root class="size-8 rounded-lg">
								<Avatar.Image src={avatarUrl} alt="Avatar" />
								<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
							</Avatar.Root>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-medium">{user.username}</span>
								<span class="truncate text-xs">Rep: {user.reputation ?? 0}</span>
							</div>
							<ChevronsUpDownIcon class="ml-auto size-4" />
						</Sidebar.MenuButton>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
					side={sidebar.isMobile ? 'bottom' : 'right'}
					align="end"
					sideOffset={4}
				>
					<DropdownMenu.Label class="p-0 font-normal">
						<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
							<Avatar.Root class="size-8 rounded-lg">
								<Avatar.Image src={avatarUrl} alt="Avatar" />
								<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
							</Avatar.Root>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-medium">{user.username}</span>
								<span class="truncate text-xs">{user.email}</span>
							</div>
						</div>
					</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<!-- TODO
					<DropdownMenu.Group>
						<DropdownMenu.Item disabled={true}>
							<UserIcon />
							Profile
						</DropdownMenu.Item>
						<DropdownMenu.Item disabled={true}>
							<BellIcon />
							Notifications
						</DropdownMenu.Item>
						<DropdownMenu.Item disabled={true}>
							<SettingsIcon />
							Settings
						</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					-->
					<DropdownMenu.Item onclick={handleSignOut}>
						<LogOutIcon />
						Log out
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{:else}
			<Sidebar.MenuButton
				size="lg"
				variant="outline"
				onclick={handleSignIn}
				class="bg-muted/50 justify-center"
			>
				<span class="font-medium">Login</span>
			</Sidebar.MenuButton>
		{/if}
	</Sidebar.MenuItem>
</Sidebar.Menu>
