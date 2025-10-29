<script lang="ts">
	import { browser } from '$app/environment';
	import ChannelPill from '$lib/components/mob/channel-pill.svelte';
	import MobHpSubmit from '$lib/components/mob/hp-submit.svelte';
	import MobLastReports from '$lib/components/mob/last-reports.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Toggle } from '$lib/components/ui/toggle/index.js';
	import { DEFAULT_HP_VALUE } from '$lib/constants';
	import { createReport } from '$lib/db/create-reports';
	import { getChannels } from '$lib/db/get-channels';
	import { getChannelReports, getLatestMobReports } from '$lib/db/get-reports';
	import { pb } from '$lib/pocketbase';
	import type { UserRecordModel } from '$lib/types/auth';
	import { getInitials } from '$lib/utils/general-utils';
	import { getMobImagePath } from '$lib/utils/mob-utils';
	import { mapUserRecord } from '$lib/utils/user-utils';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { untrack } from 'svelte';

	let {
		open = false,
		mobId,
		mobName,
		totalChannels,
		liveChannels = [],
		onClose,
		onReportSubmitted,
		type = 'boss',
		initialSelectedChannel = null
	}: {
		open?: boolean;
		mobId: string;
		mobName: string;
		totalChannels: number;
		liveChannels?: Array<{
			channel: number;
			status: 'alive' | 'dead' | 'unknown';
			hp_percentage: number;
			last_updated: string;
		}>;
		onClose?: () => void;
		onReportSubmitted?: (data: { mobId: string; channel: number; hp_percentage: number }) => void;
		type?: 'boss' | 'magical_creature' | string;
		initialSelectedChannel?: number | null;
	} = $props();

	let submission_state = $state({
		selectedChannel: null as number | null,
		hpValue: DEFAULT_HP_VALUE,
		fullVoteCount: 0,
		isSubmitting: false
	});

	let data_state = $state({
		channels: [] as Array<{
			channel: number;
			status: 'alive' | 'dead' | 'unknown';
			hp_percentage: number;
			last_updated?: string;
		}>,
		reports: [] as Array<{
			id: string;
			channel: number;
			hp_percentage: number;
			user: {
				id: string;
				name: string;
				avatar?: string;
			};
			create_time: string;
		}>
	});

	let ui_state = $state({
		isLoading: false,
		isLoadingReports: false,
		showBackButton: false,
		errorMessage: null as string | null,
		hasError: false,
		isPanelVisible: true
	});

	let activeTab = $state('submit');

	let initialChannelHandled = $state(false);

	// Get user from context
	let user = $derived.by(() => pb.authStore.record as UserRecordModel);

	// Reset modal state when opening
	$effect(() => {
		if (browser && open && mobId) {
			// Reset all modal state
			submission_state.selectedChannel = null;
			submission_state.hpValue = DEFAULT_HP_VALUE;
			submission_state.fullVoteCount = 0;
			submission_state.isSubmitting = false;
			data_state.channels = [];
			data_state.reports = [];
			ui_state.isLoading = false;
			ui_state.showBackButton = false;
			ui_state.errorMessage = null;
			ui_state.hasError = false;
			initialChannelHandled = false;

			// Fetch fresh data
			fetchMobDetails();
		}
	});

	// Handle initial channel selection
	$effect(() => {
		if (browser && open && mobId && initialSelectedChannel && !initialChannelHandled) {
			initialChannelHandled = true;
			handleChannelClick(initialSelectedChannel);
		}
	});

	// Update HP value when channel data loads
	$effect(() => {
		if (
			initialSelectedChannel &&
			data_state.channels.length > 0 &&
			submission_state.hpValue === DEFAULT_HP_VALUE
		) {
			const channel = data_state.channels.find((c) => c.channel === initialSelectedChannel);
			if (channel && channel.hp_percentage > 0) {
				submission_state.hpValue = channel.hp_percentage;
			}
		}
	});

	// Realtime subscription for channel grid updates
	$effect(() => {
		if (!browser || !open || !liveChannels.length) return;

		// Use untrack to read current channels without making effect depend on it
		// This prevents infinite loop
		const currentChannels = untrack(() => data_state.channels);

		// If no current channels loaded yet, initialize from liveChannels
		if (currentChannels.length === 0) {
			data_state.channels = liveChannels;
			return;
		}

		// Merge live channel data with existing grid
		const updated = currentChannels.map((ch) => {
			const liveData = liveChannels.find((live) => live.channel === ch.channel);
			return liveData || ch; // Use live data if available, otherwise keep existing
		});

		data_state.channels = updated;
	});

	async function fetchMobDetails(skipLoading = false) {
		if (!skipLoading) {
			ui_state.isLoading = true;
		}
		try {
			// Validate totalChannels is available
			if (!totalChannels || totalChannels <= 0) {
				throw new Error(
					`Invalid totalChannels (${totalChannels}) for mob ${mobName} (${mobId}). This should be provided by the parent component.`
				);
			}

			// Fetch existing channel statuses
			const channel_statuses = await getChannels(mobId);

			// Create a complete channel list (1 to totalChannels) with existing data or unknown status
			const all_channels: Array<{
				channel: number;
				status: 'alive' | 'dead' | 'unknown';
				hp_percentage: number;
				last_updated?: string;
			}> = [];

			for (let i = 1; i <= totalChannels; i++) {
				const status_data = channel_statuses.find((c) => c.channel === i);
				if (status_data) {
					all_channels.push(status_data);
				} else {
					// Create a default channel entry with unknown status
					all_channels.push({
						channel: i,
						status: 'unknown',
						hp_percentage: 0
					});
				}
			}

			data_state.channels = all_channels;

			// Only fetch latest reports if no specific channel is selected
			if (!initialSelectedChannel) {
				data_state.reports = await getLatestMobReports(mobId, 10);
			}
		} catch (error) {
			// Store error for display
			const error_msg = error instanceof Error ? error.message : 'Failed to load mob details';
			ui_state.errorMessage = error_msg;
			ui_state.hasError = true;
		} finally {
			if (!skipLoading) {
				ui_state.isLoading = false;
			}
		}
	}

	async function fetchChannelReports(channelNumber: number, skipLoading = false) {
		if (!skipLoading) {
			ui_state.isLoadingReports = true;
		}
		ui_state.errorMessage = null;
		ui_state.hasError = false;
		try {
			const reports_data = await getChannelReports(mobId, channelNumber);
			// Force a fresh array assignment to ensure reactivity
			data_state.reports = [...reports_data];
		} catch (error) {
			const error_msg = error instanceof Error ? error.message : 'Failed to load channel reports';
			ui_state.errorMessage = error_msg;
			ui_state.hasError = true;
		} finally {
			if (!skipLoading) {
				ui_state.isLoadingReports = false;
			}
		}
	}

	let initials = $derived(getInitials(mobName));

	// Dynamic class for left section based on panel visibility
	let leftSectionClass = $derived(
		`flex flex-1 flex-col overflow-hidden pr-0 lg:flex-none lg:pr-2 ${
			ui_state.isPanelVisible ? 'lg:w-3/4' : 'lg:w-full'
		}`
	);

	// Create channel grid for all channels - memoized to only recalculate when channels or totalChannels change
	let channelGrid = $derived.by(() => {
		if (!totalChannels || !data_state.channels.length) return [];

		return Array.from({ length: totalChannels }, (_, i) => {
			const channel_num = i + 1;
			const channel_data = data_state.channels.find((c) => c.channel === channel_num);
			return {
				channelNumber: channel_num,
				status: channel_data?.status || 'unknown',
				hpPercentage: channel_data?.hp_percentage || 0
			};
		});
	});

	function handleChannelClick(channelNumber: number) {
		submission_state.selectedChannel = channelNumber;
		ui_state.showBackButton = true;

		// Clear old reports and show loading state
		data_state.reports = [];
		ui_state.isLoadingReports = true;

		// Set HP value to current channel's HP if available
		const channel = data_state.channels.find((c) => c.channel === channelNumber);
		submission_state.hpValue =
			channel && channel.hp_percentage > 0 ? channel.hp_percentage : DEFAULT_HP_VALUE;
		submission_state.fullVoteCount = 0;

		fetchChannelReports(channelNumber);
	}

	function handleBackToAllReports() {
		submission_state.selectedChannel = null;
		ui_state.showBackButton = false;

		// Only refresh reports for all channels, don't refetch channel data
		// Channel grid is already kept up-to-date via realtime updates
		ui_state.isLoadingReports = true;
		getLatestMobReports(mobId, 10)
			.then((reports) => {
				data_state.reports = reports;
			})
			.catch((error) => {
				console.error('Error loading latest reports:', error);
				ui_state.errorMessage = 'Failed to load latest reports';
				ui_state.hasError = true;
			})
			.finally(() => {
				ui_state.isLoadingReports = false;
			});
	}

	async function handleRefreshReports(skipLoading = false) {
		// ONLY refresh reports, not the channel grid (which updates via realtime)
		if (submission_state.selectedChannel) {
			await fetchChannelReports(submission_state.selectedChannel, skipLoading);
		} else {
			// Refresh latest reports for all channels
			ui_state.isLoadingReports = true;
			try {
				data_state.reports = await getLatestMobReports(mobId, 10);
			} catch (error) {
				console.error('Error refreshing latest reports:', error);
			} finally {
				ui_state.isLoadingReports = false;
			}
		}
	}

	async function handleSubmitReport() {
		if (!submission_state.selectedChannel || !user) return;

		submission_state.isSubmitting = true;
		const previous_reports = data_state.reports;

		try {
			// Optimistic update
			const optimistic_report = {
				id: `optimistic-${Date.now()}`,
				channel: submission_state.selectedChannel,
				hp_percentage: submission_state.hpValue,
				user: mapUserRecord(user),
				create_time: new Date().toISOString()
			};

			// Prepend to show immediately
			data_state.reports = [optimistic_report, ...previous_reports];

			// Update channel status optimistically
			data_state.channels = data_state.channels.map((channel) =>
				channel.channel === submission_state.selectedChannel
					? {
							...channel,
							hp_percentage: submission_state.hpValue,
							status:
								submission_state.hpValue === 0 ? 'dead' : ('alive' as 'alive' | 'dead' | 'unknown')
						}
					: channel
			);

			// Submit to server
			await createReport(
				mobId,
				submission_state.selectedChannel,
				submission_state.hpValue,
				user.id
			);

			// Call callback to parent for optimistic updates
			onReportSubmitted?.({
				mobId,
				channel: submission_state.selectedChannel,
				hp_percentage: submission_state.hpValue
			});

			// Small delay to ensure database write is complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Fetch fresh data from server (will replace optimistic report)
			if (submission_state.selectedChannel) {
				await fetchChannelReports(submission_state.selectedChannel, true);
			}
		} catch (error) {
			// Rollback to previous state on error
			data_state.reports = previous_reports;

			const error_msg = error instanceof Error ? error.message : 'Failed to submit report';
			ui_state.errorMessage = error_msg;
			ui_state.hasError = true;
		} finally {
			submission_state.isSubmitting = false;
		}
	}
</script>

<Dialog.Root
	bind:open
	onOpenChange={(isOpen) => {
		if (!isOpen && onClose) onClose();
	}}
>
	<Dialog.Content
		class="h-[95vh] max-h-[90vh] w-[95vw]! max-w-[1400px]! overflow-hidden lg:h-[90vh]"
		style="width: 95vw !important; max-width: 1400px !important;"
	>
		<Dialog.Header>
			<div class="flex items-center space-x-2 lg:space-x-3">
				<Avatar.Root class="h-10 w-10 lg:h-12 lg:w-12">
					<Avatar.Image src={getMobImagePath(type, mobName)} alt={mobName} />
					<Avatar.Fallback class="bg-red-500 text-base font-bold text-white lg:text-lg">
						{initials}
					</Avatar.Fallback>
				</Avatar.Root>
				<div>
					<Dialog.Title class="text-lg font-bold lg:text-xl">{mobName}</Dialog.Title>
					<p class="text-muted-foreground text-xs lg:text-sm">{totalChannels} channels total</p>
				</div>
			</div>
		</Dialog.Header>

		<!-- Main content with grid layout -->
		<div class="flex h-[calc(95vh-140px)] flex-col gap-4 lg:h-[calc(90vh-140px)] lg:flex-row">
			<!-- Left section: Channel Grid (3/4 width on desktop when panel visible, full width when hidden) -->
			<div class={leftSectionClass}>
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold">
						{submission_state.selectedChannel
							? `Channel ${submission_state.selectedChannel} Details`
							: 'All Channels'}
					</h3>
					<div class="flex items-center gap-1 lg:gap-2">
						{#if ui_state.showBackButton}
							<Button
								onclick={handleBackToAllReports}
								variant="outline"
								size="sm"
								class="text-xs lg:text-sm"
							>
								<span class="hidden lg:inline">← Back to All Reports</span>
								<span class="lg:hidden">← Back</span>
							</Button>
						{/if}
						<Toggle
							bind:pressed={ui_state.isPanelVisible}
							variant="outline"
							size="sm"
							title={ui_state.isPanelVisible ? 'Hide panel' : 'Show panel'}
						>
							{#if ui_state.isPanelVisible}
								<Eye class="h-4 w-4" />
							{:else}
								<EyeOff class="h-4 w-4" />
							{/if}
						</Toggle>
					</div>
				</div>
				<div class="bg-background flex-1 overflow-y-auto rounded-lg border p-4 md:flex-1">
					{#if ui_state.isLoading}
						<div class="flex h-32 items-center justify-center">
							<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
							<p class="text-muted-foreground ml-3 text-sm">Loading mob data...</p>
						</div>
					{:else if ui_state.hasError}
						<div class="py-8 text-center text-red-500">
							<p class="font-semibold">Error Loading Mob Data</p>
							<p class="text-sm">{ui_state.errorMessage}</p>
							<Button
								onclick={() => {
									ui_state.hasError = false;
									ui_state.errorMessage = null;
									fetchMobDetails();
								}}
								variant="destructive"
								class="mt-4"
							>
								Retry
							</Button>
						</div>
					{:else if channelGrid.length > 0}
						<div class="grid grid-cols-5 gap-1 lg:grid-cols-10">
							{#each channelGrid as channel (channel.channelNumber)}
								<ChannelPill
									channelNumber={channel.channelNumber}
									status={channel.status}
									hpPercentage={channel.hpPercentage}
									clickable={true}
									onclick={() => handleChannelClick(channel.channelNumber)}
								/>
							{/each}
						</div>
					{:else}
						<p class="text-muted-foreground py-8 text-center">No channel data available</p>
					{/if}
				</div>
			</div>

			<!-- Right section: HP Reporting and Reports (1/4 width on desktop, full width on mobile/tablet) -->
			{#if ui_state.isPanelVisible}
				<div class="flex w-full flex-col lg:h-full lg:w-1/4 lg:max-w-sm lg:min-w-[280px]">
					<!-- Desktop layout: stacked components -->
					<div class="hidden h-full lg:flex lg:flex-col lg:space-y-4">
						<!-- HP Reporting Section -->
						<MobHpSubmit
							selectedChannel={submission_state.selectedChannel}
							{user}
							bind:hpValue={submission_state.hpValue}
							bind:fullVoteCount={submission_state.fullVoteCount}
							isSubmitting={submission_state.isSubmitting}
							onSubmit={handleSubmitReport}
						/>

						<!-- Reports Section -->
						<div class="flex-1 overflow-hidden">
							<MobLastReports
								reports={data_state.reports}
								isLoadingReports={ui_state.isLoadingReports}
								selectedChannel={submission_state.selectedChannel}
								onRefresh={() => handleRefreshReports(false)}
							/>
						</div>
					</div>

					<!-- Mobile/tablet layout: tabs -->
					<div class="lg:hidden">
						<Tabs.Root bind:value={activeTab}>
							<Tabs.List class="grid w-full grid-cols-2">
								<Tabs.Trigger value="submit">Submit HP</Tabs.Trigger>
								<Tabs.Trigger value="reports">Reports</Tabs.Trigger>
							</Tabs.List>
							<Tabs.Content value="submit" class="mt-4">
								<div class="max-h-[35vh] overflow-y-auto">
									<MobHpSubmit
										selectedChannel={submission_state.selectedChannel}
										{user}
										bind:hpValue={submission_state.hpValue}
										bind:fullVoteCount={submission_state.fullVoteCount}
										isSubmitting={submission_state.isSubmitting}
										onSubmit={handleSubmitReport}
									/>
								</div>
							</Tabs.Content>
							<Tabs.Content value="reports" class="mt-4">
								<div class="max-h-[35vh] overflow-y-auto">
									<MobLastReports
										reports={data_state.reports}
										isLoadingReports={ui_state.isLoadingReports}
										selectedChannel={submission_state.selectedChannel}
										onRefresh={() => handleRefreshReports(false)}
									/>
								</div>
							</Tabs.Content>
						</Tabs.Root>
					</div>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
