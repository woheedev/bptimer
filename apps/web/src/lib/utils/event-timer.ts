import { DAY, GAME_TIMEZONE_OFFSET, HOUR, MINUTE, SECOND } from '$lib/constants';
import type { EventConfig, EventStatus } from '$lib/types/events';

export const EVENT_CONFIGS: EventConfig[] = [
	{
		id: 'guild-hunt',
		name: 'Guild Hunt',
		icon: '/images/events/guild-hunt.webp',
		schedule: {
			days: [5, 6, 0],
			hour: 14,
			minute: 0,
			durationHours: 14
		}
	},
	{
		id: 'world-boss',
		name: 'World Boss',
		icon: '/images/events/world-boss.webp',
		schedule: {
			days: [0, 1, 2, 3, 4, 5, 6],
			hour: 16,
			minute: 0,
			durationHours: 6
		}
	},
	{
		id: 'guild-dance',
		name: 'Guild Dance',
		icon: '/images/events/guild-dance.webp',
		schedule: {
			days: [5],
			hour: 15,
			minute: 30,
			durationHours: 12
		}
	},
	{
		id: 'stimen-vaults',
		name: 'Stimen Vaults',
		icon: '/images/events/stimen-vault.webp',
		schedule: {
			days: [0, 1, 2, 3, 4, 5, 6],
			hour: 2,
			minute: 0,
			durationHours: 3
		}
	},
	{
		id: 'daily-reset',
		name: 'Daily Reset',
		icon: '/images/events/daily-reset.webp',
		schedule: {
			days: [0, 1, 2, 3, 4, 5, 6],
			hour: 5,
			minute: 0
		}
	},
	{
		id: 'weekly-reset',
		name: 'Weekly Reset',
		icon: '/images/events/weekly-reset.webp',
		schedule: {
			days: [1],
			hour: 2,
			minute: 0
		}
	}
];

export function formatCountdown(milliseconds: number): string {
	const totalSeconds = Math.floor(milliseconds / SECOND);
	const days = Math.floor(totalSeconds / (DAY / SECOND));
	const hours = Math.floor((totalSeconds % (DAY / SECOND)) / (HOUR / SECOND));
	const minutes = Math.floor((totalSeconds % (HOUR / SECOND)) / (MINUTE / SECOND));
	const seconds = totalSeconds % (MINUTE / SECOND);

	if (days > 0) {
		return `${days}d ${hours}h ${minutes}m`;
	} else if (hours > 0) {
		return `${hours}h ${minutes}m ${seconds}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	} else {
		return `${seconds}s`;
	}
}

function getGameTime(): Date {
	return new Date(Date.now() + GAME_TIMEZONE_OFFSET * HOUR);
}

export function calculateNextEventTime(config: EventConfig): Date {
	const now = getGameTime();
	const currentDay = now.getUTCDay();
	const currentHour = now.getUTCHours();
	const currentMinute = now.getUTCMinutes();

	const targetStart = new Date(now);
	targetStart.setUTCHours(config.schedule.hour, config.schedule.minute, 0, 0);

	if (!config.schedule.days) {
		if (targetStart <= now) {
			targetStart.setUTCDate(targetStart.getUTCDate() + 1);
		}
		return targetStart;
	}

	const eventHasPassed =
		currentHour > config.schedule.hour ||
		(currentHour === config.schedule.hour && currentMinute >= config.schedule.minute);

	let daysToAdd = 0;
	if (!config.schedule.days.includes(currentDay) || eventHasPassed) {
		for (let i = 1; i <= 7; i++) {
			const nextDay = (currentDay + i) % 7;
			if (config.schedule.days.includes(nextDay)) {
				daysToAdd = i;
				break;
			}
		}
	}

	targetStart.setUTCDate(targetStart.getUTCDate() + daysToAdd);
	return targetStart;
}

export function calculateCurrentEventEnd(config: EventConfig): Date | null {
	if (!config.schedule.durationHours) return null;

	const now = getGameTime();
	const currentDay = now.getUTCDay();

	const todayStart = new Date(now);
	todayStart.setUTCHours(config.schedule.hour, config.schedule.minute, 0, 0);
	const todayEnd = new Date(todayStart);
	todayEnd.setUTCHours(todayEnd.getUTCHours() + config.schedule.durationHours);

	if (config.schedule.days?.includes(currentDay) && now >= todayStart && now < todayEnd) {
		return todayEnd;
	}

	const previousDay = (currentDay - 1 + 7) % 7;
	if (config.schedule.days?.includes(previousDay)) {
		const yesterdayStart = new Date(now);
		yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
		yesterdayStart.setUTCHours(config.schedule.hour, config.schedule.minute, 0, 0);
		const yesterdayEnd = new Date(yesterdayStart);
		yesterdayEnd.setUTCHours(yesterdayEnd.getUTCHours() + config.schedule.durationHours);

		if (now >= yesterdayStart && now < yesterdayEnd) {
			return yesterdayEnd;
		}
	}

	return null;
}

export function isEventActive(config: EventConfig): boolean {
	if (!config.schedule.durationHours) return false;

	const now = getGameTime();
	const currentDay = now.getUTCDay();

	const todayStart = new Date(now);
	todayStart.setUTCHours(config.schedule.hour, config.schedule.minute, 0, 0);
	const todayEnd = new Date(todayStart);
	todayEnd.setUTCHours(todayEnd.getUTCHours() + config.schedule.durationHours);

	if (config.schedule.days?.includes(currentDay) && now >= todayStart && now < todayEnd) {
		return true;
	}

	const previousDay = (currentDay - 1 + 7) % 7;
	if (config.schedule.days?.includes(previousDay)) {
		const yesterdayStart = new Date(now);
		yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
		yesterdayStart.setUTCHours(config.schedule.hour, config.schedule.minute, 0, 0);
		const yesterdayEnd = new Date(yesterdayStart);
		yesterdayEnd.setUTCHours(yesterdayEnd.getUTCHours() + config.schedule.durationHours);

		if (now >= yesterdayStart && now < yesterdayEnd) {
			return true;
		}
	}

	return false;
}

export function getEventStatus(config: EventConfig): EventStatus {
	return isEventActive(config) ? 'active' : 'upcoming';
}
