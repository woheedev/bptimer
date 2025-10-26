<script lang="ts">
	import { browser } from '$app/environment';
	import ChannelPill from '$lib/components/mob/channel-pill.svelte';
	import MobHpSubmit from '$lib/components/mob/hp-submit.svelte';
	import MobLastReports from '$lib/components/mob/last-reports.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { DEFAULT_HP_VALUE } from '$lib/constants';
	import { createReport } from '$lib/db/create-reports';
	import { getChannels } from '$lib/db/get-channels';
	import { getChannelReports, getLatestMobReports } from '$lib/db/get-reports';
	import { pb } from '$lib/pocketbase';
	import { getInitials } from '$lib/utils/general-utils';
	import { getMobImagePath } from '$lib/utils/mob-utils';
	import { mapUserRecord } from '$lib/utils/user-utils';
	import type { UserRecordModel } from '$types/auth';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	let {
		open = false,
		mobId,
		mobName,
		totalChannels,
		onClose,
		onReportSubmitted,
		type = 'boss',
		initialSelectedChannel = null
	}: {
		open?: boolean;
		mobId: string;
		mobName: string;
		totalChannels: number;
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
		hasError: false
	});

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

	async function fetchMobDetails() {
		ui_state.isLoading = true;
		try {
			// Validate totalChannels is available
			if (!totalChannels || totalChannels <= 0) {
				throw new Error(
					`Invalid totalChannels (${totalChannels}) for mob ${mobName} (${mobId}). This should be provided by the parent component.`
				);
			}

			// Fetch existing channel statuses
			const channel_statuses = await getChannels(mobId);

			// Create a complete channel list with default values for missing ones
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

			// Sort channels by last_updated descending (most recent first), unknown channels at end
			all_channels.sort((a, b) => {
				const aTime = a.last_updated ? new Date(a.last_updated).getTime() : 0;
				const bTime = b.last_updated ? new Date(b.last_updated).getTime() : 0;
				if (aTime !== bTime) {
					return bTime - aTime; // Descending
				}
				// If same time , sort by channel number
				return a.channel - b.channel;
			});

			data_state.channels = all_channels;

			// Fetch latest 10 reports for this mob
			data_state.reports = await getLatestMobReports(mobId, 10);
		} catch (error) {
			// Store error for display
			const error_msg = error instanceof Error ? error.message : 'Failed to load mob details';
			ui_state.errorMessage = error_msg;
			ui_state.hasError = true;
		} finally {
			ui_state.isLoading = false;
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
		fetchMobDetails();
	}

	async function handleRefresh() {
		// Always refresh channel grid
		await fetchMobDetails();

		// If a channel is selected, also refresh its specific reports
		if (submission_state.selectedChannel) {
			await fetchChannelReports(submission_state.selectedChannel);
		}
		// If no channel selected, fetchMobDetails already refreshed the latest reports
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
		class="max-h-[90vh] w-[90vw]! max-w-[1400px]! overflow-hidden"
		style="width: 90vw !important; max-width: 1400px !important;"
	>
		<Dialog.Header>
			<div class="flex items-center space-x-3">
				<Avatar.Root class="h-12 w-12">
					<Avatar.Image src={getMobImagePath(type, mobName)} alt={mobName} />
					<Avatar.Fallback class="bg-red-500 text-lg font-bold text-white">
						{initials}
					</Avatar.Fallback>
				</Avatar.Root>
				<div>
					<Dialog.Title class="text-xl font-bold">{mobName}</Dialog.Title>
					<p class="text-muted-foreground text-sm">{totalChannels} channels total</p>
				</div>
			</div>
		</Dialog.Header>

		<!-- Main content with grid layout -->
		<div class="flex h-[calc(90vh-140px)] gap-4">
			<!-- Left section: Channel Grid (3/4 width) -->
			<div class="flex flex-1 flex-col overflow-hidden pr-2">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold">
						{submission_state.selectedChannel
							? `Channel ${submission_state.selectedChannel} Details`
							: 'All Channels'}
					</h3>
					<div class="flex items-center gap-2">
						{#if ui_state.showBackButton}
							<Button onclick={handleBackToAllReports} variant="outline" size="sm">
								← Back to All Reports
							</Button>
						{/if}
						<Button
							onclick={handleRefresh}
							variant="outline"
							size="sm"
							disabled={ui_state.isLoading}
							title="Refresh data"
						>
							<RefreshCw class="h-4 w-4" />
						</Button>
					</div>
				</div>
				<div class="bg-background flex-1 overflow-y-auto rounded-lg border p-4">
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
						<div class="grid grid-cols-10 gap-1">
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

			<!-- Right section: HP Reporting and Reports (1/4 width) -->
			<div class="flex w-1/4 max-w-sm min-w-[280px] flex-col space-y-4">
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
				<MobLastReports
					reports={data_state.reports}
					isLoadingReports={ui_state.isLoadingReports}
					selectedChannel={submission_state.selectedChannel}
				/>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
