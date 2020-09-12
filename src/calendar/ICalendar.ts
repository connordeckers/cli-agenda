export interface Calendar {}

export interface Event {}

export interface ICalendar {
	Calendar(id: string): Promise<Calendar>;
	Calendars(): Promise<Calendar[]>;
	Event(calendar: string, event: string): Promise<Event>;
	Events(calendar: string): Promise<Event[]>;
}
