import { DAY, DEFAULT_REGION, HOUR, MINUTE, REGIONS, SECOND } from '$lib/constants';
import type { EventConfig, EventSchedule, EventStatus } from '$lib/types/events';

function isRegionSpecificSchedule(
	schedule: EventSchedule | Record<string, EventSchedule>
): schedule is Record<string, EventSchedule> {
	const regionKeys = REGIONS.map((r) => r.value);
	return regionKeys.every((key) => key in schedule);
}

export function getScheduleForRegion(
	config: EventConfig,
	region: string = DEFAULT_REGION
): EventSchedule {
	if (isRegionSpecificSchedule(config.schedule)) {
		return config.schedule[region] || config.schedule[DEFAULT_REGION];
	}
	return config.schedule;
}

export const EVENT_CONFIGS: EventConfig[] = [
	{
		id: 'daily-reset',
		name: 'Daily Reset',
		icon: '/images/events/daily-reset.webp',
		schedule: {
			NA: {
				days: [0, 1, 2, 3, 4, 5, 6],
				hour: 7, // 5AM UTC-2
				minute: 0
			},
			SEA: {
				days: [0, 1, 2, 3, 4, 5, 6],
				hour: 22, // 8PM UTC-2
				minute: 0
			}
		}
	},
	{
		id: 'weekly-reset',
		name: 'Weekly Reset',
		icon: '/images/events/weekly-reset.webp',
		schedule: {
			NA: {
				days: [1],
				hour: 7, // 5AM UTC-2
				minute: 0
			},
			SEA: {
				days: [0],
				hour: 22, // 8PM UTC-2
				minute: 0
			}
		}
	},
	{
		id: 'world-boss',
		name: 'World Boss',
		icon: '/images/events/world-boss.webp',
		schedule: {
			NA: {
				days: [0, 1, 2, 3, 4, 5, 6],
				hour: 18, // 4PM UTC-2
				minute: 0,
				durationHours: 6
			},
			SEA: {
				days: [0, 1, 2, 3, 4, 5, 6],
				hour: 13, // 11:30AM UTC-2
				minute: 30,
				durationHours: 1,
				durationMinutes: 30
			}
		}
	},
	{
		id: 'guild-hunt',
		name: 'Guild Hunt',
		icon: '/images/events/guild-hunt.webp',
		schedule: {
			NA: {
				days: [5, 6, 0],
				hour: 16, // 2PM UTC-2
				minute: 0,
				durationHours: 14
			},
			SEA: {
				days: [5, 6, 0],
				hour: 1, // 1AM UTC-2
				minute: 0,
				durationHours: 14
			}
		}
	},
	{
		id: 'guild-dance',
		name: 'Guild Dance',
		icon: '/images/events/guild-dance.webp',
		schedule: {
			NA: {
				days: [5],
				hour: 17, // 3:30PM UTC-2
				minute: 30,
				durationHours: 12
			},
			SEA: {
				days: [5],
				hour: 4, // 2:30AM UTC-2
				minute: 30,
				durationHours: 12
			}
		}
	},
	{
		id: 'stimen-vaults',
		name: 'Stimen Vaults',
		icon: '/images/events/stimen-vault.webp',
		schedule: {
			NA: {
				days: [1],
				hour: 4, // 2AM UTC-2
				minute: 0,
				durationHours: 3,
				intervalWeeks: 2,
				referenceDate: '2025-10-20',
				inverted: true
			},
			SEA: {
				days: [0], // TODO: NEED TO VERIFY ACTUAL TIME / RESET DATE
				hour: 19,
				minute: 0,
				durationHours: 3,
				intervalWeeks: 2,
				referenceDate: '2025-12-08',
				inverted: true
			}
		}
	}
];

function getWeeksSinceReference(referenceDate: string, targetDate: Date): number {
	const reference = new Date(referenceDate);
	const diffMs = targetDate.getTime() - reference.getTime();
	return Math.floor(diffMs / (7 * DAY));
}

function isValidIntervalWeek(
	config: EventConfig,
	date: Date,
	region: string = DEFAULT_REGION
): boolean {
	const schedule = getScheduleForRegion(config, region);
	if (!schedule.intervalWeeks || schedule.intervalWeeks <= 1) {
		return true;
	}
	if (!schedule.referenceDate) {
		return true;
	}
	const weeksSince = getWeeksSinceReference(schedule.referenceDate, date);
	return weeksSince % schedule.intervalWeeks === 0;
}

function addDurationToDate(date: Date, schedule: EventSchedule): Date {
	const result = new Date(date);
	result.setUTCHours(
		result.getUTCHours() + (schedule.durationHours || 0),
		result.getUTCMinutes() + (schedule.durationMinutes || 0),
		0,
		0
	);
	return result;
}

function checkEventActiveForDay(
	config: EventConfig,
	schedule: EventSchedule,
	now: Date,
	dayOffset: number,
	region: string
): { isActive: boolean; start: Date; end: Date } | null {
	const currentDay = now.getUTCDay();
	const targetDay = (currentDay + dayOffset + 7) % 7;

	if (!schedule.days?.includes(targetDay)) {
		return null;
	}

	const eventStart = new Date(now);
	eventStart.setUTCDate(eventStart.getUTCDate() + dayOffset);
	eventStart.setUTCHours(schedule.hour, schedule.minute, 0, 0);
	const eventEnd = addDurationToDate(eventStart, schedule);

	if (isValidIntervalWeek(config, eventStart, region) && now >= eventStart && now < eventEnd) {
		return { isActive: true, start: eventStart, end: eventEnd };
	}

	return null;
}

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

export function calculateNextEventTime(config: EventConfig, region: string = DEFAULT_REGION): Date {
	const schedule = getScheduleForRegion(config, region);
	const now = new Date();
	const currentDay = now.getUTCDay();
	const currentHour = now.getUTCHours();
	const currentMinute = now.getUTCMinutes();

	const targetStart = new Date(now);
	targetStart.setUTCHours(schedule.hour, schedule.minute, 0, 0);

	const eventHasPassed =
		currentHour > schedule.hour ||
		(currentHour === schedule.hour && currentMinute >= schedule.minute);

	let daysToAdd = 0;
	if (!schedule.days?.includes(currentDay) || eventHasPassed) {
		for (let i = 1; i <= 7; i++) {
			const nextDay = (currentDay + i) % 7;
			if (schedule.days?.includes(nextDay)) {
				daysToAdd = i;
				break;
			}
		}
	}

	targetStart.setUTCDate(targetStart.getUTCDate() + daysToAdd);

	if (schedule.intervalWeeks && schedule.intervalWeeks > 1 && schedule.referenceDate) {
		const weeksSince = getWeeksSinceReference(schedule.referenceDate, targetStart);
		const remainder = weeksSince % schedule.intervalWeeks;
		if (remainder !== 0) {
			const weeksToAdd = schedule.intervalWeeks - remainder;
			targetStart.setUTCDate(targetStart.getUTCDate() + weeksToAdd * 7);
		}
	}

	return targetStart;
}

export function calculateCurrentEventEnd(
	config: EventConfig,
	region: string = DEFAULT_REGION
): Date | null {
	const schedule = getScheduleForRegion(config, region);
	if (!schedule.durationHours && !schedule.durationMinutes) return null;

	const now = new Date();

	const todayCheck = checkEventActiveForDay(config, schedule, now, 0, region);
	if (todayCheck) {
		return todayCheck.end;
	}

	const yesterdayCheck = checkEventActiveForDay(config, schedule, now, -1, region);
	if (yesterdayCheck) {
		return yesterdayCheck.end;
	}

	return null;
}

export function isEventActive(config: EventConfig, region: string = DEFAULT_REGION): boolean {
	const schedule = getScheduleForRegion(config, region);
	if (!schedule.durationHours && !schedule.durationMinutes) return false;

	const now = new Date();

	const todayCheck = checkEventActiveForDay(config, schedule, now, 0, region);
	const yesterdayCheck = checkEventActiveForDay(config, schedule, now, -1, region);
	const isCurrentlyActive = todayCheck?.isActive || yesterdayCheck?.isActive || false;

	return schedule.inverted ? !isCurrentlyActive : isCurrentlyActive;
}

export function getEventStatus(config: EventConfig, region: string = DEFAULT_REGION): EventStatus {
	return isEventActive(config, region) ? 'active' : 'upcoming';
}
