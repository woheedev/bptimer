import { browser } from '$app/environment';
import { EVENT_TIMERS_COLLAPSED_STORAGE_KEY } from '$lib/constants';
import { regionStore } from '$lib/stores/region.svelte';
import type { EventTimer } from '$lib/types/events';
import {
	calculateCurrentEventEnd,
	calculateNextEventTime,
	EVENT_CONFIGS,
	formatCountdown,
	getEventStatus,
	getScheduleForRegion,
	isEventActive
} from '$lib/utils/event-timer';

function createEventTimersStore() {
	let timers = $state<EventTimer[]>([]);
	let isCollapsed = $state(true);

	if (browser) {
		const stored = localStorage.getItem(EVENT_TIMERS_COLLAPSED_STORAGE_KEY);
		isCollapsed = stored === null ? false : stored === 'true';
	}

	function updateTimers() {
		const region = regionStore.value;
		const now = new Date();

		timers = EVENT_CONFIGS.map((config) => {
			const schedule = getScheduleForRegion(config, region);
			const active = isEventActive(config, region);
			const status = getEventStatus(config, region);
			const nextEventTime = calculateNextEventTime(config, region);

			const targetTime: Date = schedule.inverted
				? active
					? nextEventTime
					: calculateCurrentEventEnd(config, region)!
				: active && (schedule.durationHours || schedule.durationMinutes)
					? calculateCurrentEventEnd(config, region)!
					: nextEventTime;

			const timeUntil = targetTime.getTime() - now.getTime();
			const countdown = formatCountdown(timeUntil);

			return {
				id: config.id,
				name: config.name,
				icon: config.icon,
				countdown,
				status,
				nextEventTime,
				isActive: active
			};
		});
	}

	function toggleCollapsed() {
		isCollapsed = !isCollapsed;
		if (browser) {
			localStorage.setItem(EVENT_TIMERS_COLLAPSED_STORAGE_KEY, isCollapsed.toString());
		}
	}

	return {
		get timers() {
			return timers;
		},
		get isCollapsed() {
			return isCollapsed;
		},
		updateTimers,
		toggleCollapsed
	};
}

export const eventTimersStore = createEventTimersStore();
