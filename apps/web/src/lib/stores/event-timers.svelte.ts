import { browser } from '$app/environment';
import { GAME_TIMEZONE_OFFSET } from '$lib/constants';
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
		const stored = localStorage.getItem('event-timers-collapsed');
		isCollapsed = stored === null ? true : stored === 'true';
	}

	function updateTimers() {
		const now = new Date(Date.now() + GAME_TIMEZONE_OFFSET * 60 * 60 * 1000);

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
			localStorage.setItem('event-timers-collapsed', isCollapsed.toString());
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
