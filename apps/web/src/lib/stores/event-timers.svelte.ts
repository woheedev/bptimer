import { browser } from '$app/environment';
import { EVENT_TIMERS_COLLAPSED_STORAGE_KEY, GAME_TIMEZONE_OFFSET, HOUR } from '$lib/constants';
import type { EventTimer } from '$lib/types/events';
import {
	calculateCurrentEventEnd,
	calculateNextEventTime,
	EVENT_CONFIGS,
	formatCountdown,
	getEventStatus,
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
		const now = new Date(Date.now() + GAME_TIMEZONE_OFFSET * HOUR);

		timers = EVENT_CONFIGS.map((config) => {
			const active = isEventActive(config);
			const status = getEventStatus(config);
			const nextEventTime = calculateNextEventTime(config);

			let targetTime: Date;
			if (active && config.schedule.durationHours) {
				targetTime = calculateCurrentEventEnd(config)!;
			} else {
				targetTime = nextEventTime;
			}

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
