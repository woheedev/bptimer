export type EventStatus = 'upcoming' | 'active' | 'ended';

export interface EventSchedule {
	days?: number[];
	hour: number;
	minute: number;
	durationHours?: number;
	intervalWeeks?: number; // Amount of weeks between occurrences
	referenceDate?: string; // ISO Date string for a known reset (for intervalWeeks) ex: 2025-10-20
	inverted?: boolean; // If true, active state is inverted (shows inactive when event is running)
}

export interface EventConfig {
	id: string;
	name: string;
	icon: string;
	schedule: EventSchedule;
}

export interface EventTimer {
	id: string;
	name: string;
	icon: string;
	countdown: string;
	status: EventStatus;
	nextEventTime: Date;
	isActive: boolean;
}
