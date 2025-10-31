<script lang="ts">
	import { browser } from '$app/environment';
	import ChannelPill from '$lib/components/mob/channel-pill.svelte';
	import FilterMenu from '$lib/components/mob/filter-menu.svelte';
	import MobHpSubmit from '$lib/components/mob/hp-submit.svelte';
	import MobLastReports from '$lib/components/mob/last-reports.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Toggle } from '$lib/components/ui/toggle/index.js';
	import { DEFAULT_HP_VALUE, SPECIAL_MAGICAL_CREATURE_LOCATION_COUNTS } from '$lib/constants';
	import { createReport } from '$lib/db/create-reports';
	import { getChannels } from '$lib/db/get-channels';
	import { getChannelReports, getLatestMobReports } from '$lib/db/get-reports';
	import { pb } from '$lib/pocketbase';
	import { filterSortSettingsStore } from '$lib/stores/filter-sort-settings.svelte';
	import type { MobReport } from '$lib/types/db';
	import type { UserRecordModel } from '$lib/types/auth';
	import { getInitials } from '$lib/utils/general-utils';
	import { filterAndSortChannels } from '$lib/utils/mob-filtering';
	import { getMobImagePath, getMobMapPath } from '$lib/utils/mob-utils';
	import { mapUserRecord } from '$lib/utils/user-utils';
	import { showToast } from '$lib/utils/toast';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import MapPin from '@lucide/svelte/icons/map-pin';
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
		isSubmitting: false,
		locationImage: null as number | null
	});

	let data_state = $state({
		channels: [] as Array<{
			channel: number;
			status: 'alive' | 'dead' | 'unknown';
			hp_percentage: number;
			last_updated?: string;
		}>,
		reports: [] as MobReport[]
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
	let mapOpen = $state(false);

	let initialChannelHandled = $state(false);

	// Get user from context
	const user = $derived.by(() => pb.authStore.record as UserRecordModel);

	// Reset modal state when opening
	$effect(() => {
		if (browser && open && mobId) {
			// Reset all modal state
			submission_state.selectedChannel = null;
			submission_state.hpValue = DEFAULT_HP_VALUE;
			submission_state.isSubmitting = false;
			submission_state.locationImage = null;
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

			// Set default location image from most recent report if available
			if (isSpecialMagicalCreature && reports_data.length > 0) {
				// Reports are already sorted by -created, so first report is most recent
				const mostRecentReport = reports_data[0];
				if (mostRecentReport?.location_image) {
					submission_state.locationImage = mostRecentReport.location_image;
				}
			}
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

	const initials = $derived(getInitials(mobName));

	// Check if this is a special magical creature requiring location images (random/rotating locations)
	const isSpecialMagicalCreature = $derived(mobName in SPECIAL_MAGICAL_CREATURE_LOCATION_COUNTS);

	// Dynamic class for left section based on panel visibility
	const leftSectionClass = $derived(
		`flex flex-1 flex-col overflow-hidden pr-0 lg:flex-none lg:pr-2 ${
			ui_state.isPanelVisible ? 'lg:w-3/4' : 'lg:w-full'
		}`
	);

	// Create filtered and sorted channel grid
	const channelGrid = $derived.by(() => {
		if (!totalChannels || !data_state.channels.length) return [];

		// Create complete channel list with all channels (1 to totalChannels)
		const allChannels = Array.from({ length: totalChannels }, (_, i) => {
			const channel_num = i + 1;
			const channel_data = data_state.channels.find((c) => c.channel === channel_num);
			return {
				channel: channel_num,
				status: channel_data?.status || 'unknown',
				hp_percentage: channel_data?.hp_percentage || 0,
				last_updated: channel_data?.last_updated || ''
			};
		});

		// Filter and sort the channels
		const filteredSortedChannels = filterAndSortChannels(
			allChannels,
			filterSortSettingsStore.sortField,
			filterSortSettingsStore.sortDirection,
			filterSortSettingsStore.hpRange,
			filterSortSettingsStore.hideStaleChannels
		);

		// Convert back to the format expected by the template
		return filteredSortedChannels.map((channel) => ({
			channelNumber: channel.channel,
			status: channel.status,
			hpPercentage: channel.hp_percentage
		}));
	});

	function handleChannelClick(channelNumber: number) {
		submission_state.selectedChannel = channelNumber;
		ui_state.showBackButton = true;

		// Clear old reports and show loading state
		data_state.reports = [];
		ui_state.isLoadingReports = true;

		// Reset location image
		if (isSpecialMagicalCreature) {
			submission_state.locationImage = null;
		}

		// Set HP value to current channel's HP if available
		const channel = data_state.channels.find((c) => c.channel === channelNumber);
		submission_state.hpValue =
			channel && channel.hp_percentage > 0 ? channel.hp_percentage : DEFAULT_HP_VALUE;

		fetchChannelReports(channelNumber);
	}

	function handleBackToAllReports() {
		submission_state.selectedChannel = null;
		ui_state.showBackButton = false;

		// Reset location image when going back to all reports
		if (isSpecialMagicalCreature) {
			submission_state.locationImage = null;
		}

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
		const previous_channels = [...data_state.channels];

		try {
			// Optimistic update
			const optimistic_report = {
				id: `optimistic-${Date.now()}`,
				channel: submission_state.selectedChannel,
				hp_percentage: submission_state.hpValue,
				user: mapUserRecord(user),
				create_time: new Date().toISOString(),
				upvotes: 0,
				downvotes: 0,
				reporter_id: user?.id || '',
				reporter_reputation: user?.reputation ?? 0
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
				user.id,
				submission_state.locationImage
			);

			// Call callback to parent for optimistic updates
			onReportSubmitted?.({
				mobId,
				channel: submission_state.selectedChannel,
				hp_percentage: submission_state.hpValue
			});
		} catch (error) {
			// Rollback to previous state on error
			data_state.reports = previous_reports;
			data_state.channels = previous_channels;

			const error_msg = error instanceof Error ? error.message : 'Failed to submit report';

			showToast.error(error_msg);
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
				</div>
			</div>
		</Dialog.Header>

		<!-- Main content with grid layout -->
		<div class="flex h-[calc(95vh-140px)] flex-col gap-4 lg:h-[calc(90vh-140px)] lg:flex-row">
			<!-- Left section: Channel Grid (3/4 width on desktop when panel visible, full width when hidden) -->
			<div class={leftSectionClass}>
				<div class="relative mb-4 flex items-center justify-between">
					{#if !isSpecialMagicalCreature}
						<Button
							onclick={() => (mapOpen = true)}
							variant="outline"
							size="sm"
							class="flex"
							title="View map location"
						>
							<MapPin class="h-4 w-4" />
							<span class="ml-2 hidden lg:inline">Map</span>
						</Button>
					{:else}
						<div></div>
					{/if}
					<h3 class="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
						{submission_state.selectedChannel
							? `Line ${submission_state.selectedChannel}`
							: 'All Lines'}
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
						<FilterMenu
							bind:sortField={filterSortSettingsStore.sortField}
							bind:sortDirection={filterSortSettingsStore.sortDirection}
							bind:hpRange={filterSortSettingsStore.hpRange}
							bind:hideStaleChannels={filterSortSettingsStore.hideStaleChannels}
						/>
						<Toggle
							bind:pressed={ui_state.isPanelVisible}
							variant="outline"
							size="sm"
							title={ui_state.isPanelVisible ? 'Hide panel' : 'Show panel'}
						>
							{#if ui_state.isPanelVisible}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
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
							{mobName}
							mobType={type}
							bind:hpValue={submission_state.hpValue}
							bind:locationImage={submission_state.locationImage}
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
								{mobName}
								mobType={type}
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
										{mobName}
										mobType={type}
										bind:hpValue={submission_state.hpValue}
										bind:locationImage={submission_state.locationImage}
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
										{mobName}
										mobType={type}
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

<!-- Map Location Drawer -->
{#if !isSpecialMagicalCreature}
	<Drawer.Root bind:open={mapOpen}>
		<Drawer.Content class="max-h-[85vh]">
			<Drawer.Header>
				<Drawer.Title>{mobName} - Map Location</Drawer.Title>
			</Drawer.Header>
			<div class="flex items-center justify-center p-4">
				<img
					src={getMobMapPath(type, mobName)}
					alt={`${mobName} map location`}
					class="max-h-[70vh] w-full rounded-lg object-contain"
					onerror={() => {
						showToast.error('Map image not found');
						mapOpen = false;
					}}
				/>
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/if}
