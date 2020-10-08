export interface Calendar {
  /** The unique ID of the calendar. */
  id: string;
  /** The title of the calendar. */
  title: string;
  /** @optional The description of the calendar. */
  description: string;
  /** The timezone for the calendar data. */
  timeZone: string;
  /** If the calendar was hidden from the web list. */
  hidden: boolean;
  /** If this is the users default calendar. */
  primary: boolean;
  /** An array of default reminders. */
  defaultReminders: { method: string; minutes: string }[];
  /** The owner of this calendar. */
  owner: User;
}

export interface User {
  email: string;
  name: string;
  self: boolean;
}

export interface Attendee {
  displayName: string;
  email?: string;
  organizer: boolean;
  going: 'none' | 'declined' | 'tentative' | 'accepted';
}

export interface Location {
  displayName: string;
  location: string;
  isOnline: boolean;
}

export interface Event {
  /** The calendar this belongs to. */
  calendar: Calendar;
  /** The unique ID of the event. */
  id: string;
  /** The name of the event. */
  name: string;
  /** The event description. */
  description: string;
  /** Your confirmed status. */
  status: 'confirmed' | 'tentative' | 'cancelled' | 'none';
  /** The permalink to view the event online. */
  permalink: string | null;
  /** When the event was created. */
  created: Date | string;
  /** When the event was updated. */
  updated: Date | string | null;
  /** Who was the creator of the event. */
  creator: User;
  /** When the event starts. */
  start: Date | string;
  /** When the event ends. */
  end: Date | string;
  /** Is an all-day event. */
  isAllDay: boolean;
  /** The attendees of the event. */
  attendees: Attendee[];
  /** Location details. */
  location: Location;
}

export interface ICalendar extends Calendar {
  event(calendar: string, event: string): Promise<Event | null>;
  events(calendar: string): Promise<Event[]>;
  today(calendar: string): Promise<Event[]>;
}
