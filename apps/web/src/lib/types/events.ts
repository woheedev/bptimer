export type EventStatus = 'upcoming' | 'active' | 'ended';

export interface EventSchedule {
	days?: number[];
	hour: number;
	minute: number;
	durationHours?: number;
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
