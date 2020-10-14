import { calendar_v3, google, people_v1 } from 'googleapis';
import dayjs from 'dayjs';
import credentials from '../credentials/google.json';
import { OAuth2 } from '../OAuth2';
import { Attendee, Calendar, Event, ICalendar } from './ICalendar';

const scopes = [
	'https://www.googleapis.com/auth/calendar',
	'https://www.googleapis.com/auth/userinfo.email',
	'https://www.googleapis.com/auth/userinfo.profile',
];

const parse = {
	calendar(cal: calendar_v3.Schema$CalendarListEntry, me: people_v1.Schema$Person): Calendar {
		const res: Calendar = {
			id: cal.id!,
			title: cal.summaryOverride ?? cal.summary ?? 'Untitled Calendar',
			description: cal.description ?? '',
			hidden: cal.hidden ?? false,
			timeZone: cal.timeZone ?? 'Australia/Hobart',
			primary: cal.primary ?? false,
			defaultReminders: [],
			owner: {
				email: me.emailAddresses?.[0].value ?? '',
				name: me.names?.[0].displayName ?? '',
				self: true,
			},
		};
		return res;
	},
	event(cal: Calendar, ev: calendar_v3.Schema$Event): Event {
		return {
			calendar: cal,
			id: ev.id!,
			name: ev.summary ?? 'Unknown Event',
			description: ev.description ?? '',
			permalink: ev.htmlLink ?? null,
			creator: {
				name: ev.organizer?.displayName ?? 'Unknown User',
				email: ev.organizer?.email ?? '',
				self: ev.organizer?.self ?? false,
			},
			attendees:
				ev.attendees?.map(
					(att) =>
						({
							displayName: att.displayName ?? 'Unknown User',
							going: att.responseStatus ?? 'none',
							organizer: att.organizer ?? false,
							email: att.email ?? '',
						} as Attendee)
				) ?? [],
			status: (ev.status as any) ?? 'none',
			created: ev.created!,
			updated: ev.updated ?? ev.created!,
			start: ev.start?.dateTime! ?? ev.originalStartTime?.dateTime,
			end: ev.end?.dateTime!,
			isAllDay: ev.end?.date != null,
			location: {
				displayName: ev.location?.includes('zoom') ? 'Zoom' : ev.location ?? '',
				location: ev.location ?? '',
				isOnline: ev.location?.startsWith('http') ?? false,
			},
		};
	},
};

const _auth = {
	AuthURL: credentials.installed.auth_uri,
	TokenURL: credentials.installed.token_uri,
	ClientID: credentials.installed.client_id,
	ClientSecret: credentials.installed.client_secret,
	Scope: scopes,
	AdditionalParams: { access_type: 'offline' },
	Platform: 'google',
};

const client = new google.auth.OAuth2({
	clientId: credentials.installed.client_id,
	clientSecret: credentials.installed.client_secret,
	redirectUri: credentials.installed.redirect_uris[0],
});

export class GoogleCalendar implements ICalendar {
	static async fetch(account: string, calendar: string) {
		const auth = new OAuth2({ ..._auth, ServiceID: account });
		const token = await auth.GetAccessToken();
		if (!token) throw new Error('Error fetching Google auth token.');
		client.setCredentials(token as any);

		const cal = google.calendar({ version: 'v3', auth: client });
		const user = google.people({ version: 'v1', auth: client });

		const me = await user.people
			.get({ personFields: 'names,emailAddresses', resourceName: 'people/me' }, {})
			.then((d) => d.data);

		const thiscal = await cal.calendars.get({ calendarId: calendar });
		if (!thiscal.data) return null;

		return new this(auth, parse.calendar(thiscal.data, me), cal, user, me);
	}

	static async fetchAll(account: string) {
		const auth = new OAuth2({ ..._auth, ServiceID: account });
		const token = await auth.GetAccessToken();
		if (!token) throw new Error('Error fetching Google auth token.');

		const client = new google.auth.OAuth2({
			clientId: credentials.installed.client_id,
			clientSecret: credentials.installed.client_secret,
			redirectUri: credentials.installed.redirect_uris[0],
		});
		client.setCredentials(token as any);

		const cal = google.calendar({ version: 'v3', auth: client });
		const user = google.people({ version: 'v1', auth: client });

		const me = await user.people
			.get({ personFields: 'names,emailAddresses', resourceName: 'people/me' }, {})
			.then((d) => d.data);

		const thiscal = await cal.calendarList.list();

		return thiscal.data.items?.map((item) => parse.calendar(item, me));
	}

	static async register(account: string) {
		const auth = new OAuth2({ ..._auth, ServiceID: account });
		return auth.GetAccessToken();
	}

	protected constructor(
		private auth: OAuth2,
		private cal: Calendar,
		private gcal: calendar_v3.Calendar,
		private user: people_v1.People,
		private myprofile: people_v1.Schema$Person
	) {}

	async today(): Promise<Event[]> {
		const start = dayjs().startOf('day').toISOString();
		const end = dayjs().endOf('day').toISOString();
		const event = await this.gcal.events.list({
			calendarId: this.id,
			timeMin: start,
			timeMax: end,
			singleEvents: true,
		});

		if (!event.data.items) return [];
		return event.data.items.map((ev) => parse.event(this, ev));
	}

	async event(id: string) {
		const event = await this.gcal.events.get({
			calendarId: this.id,
			eventId: id,
		});
		if (!event.data) return null;
		return parse.event(this, event.data);
	}

	async events() {
		const event = await this.gcal.events.list({
			calendarId: this.id,
			timeMin: dayjs().startOf('day').toISOString(),
			timeMax: dayjs().add(14, 'day').toISOString(),
		});

		if (!event.data.items) return [];
		return event.data.items.map((ev) => parse.event(this, ev));
	}

	public get id() {
		return this.cal.id;
	}
	public get title() {
		return this.cal.title;
	}
	public get description() {
		return this.cal.description;
	}
	public get timeZone() {
		return this.cal.timeZone;
	}
	public get hidden() {
		return this.cal.hidden;
	}
	public get primary() {
		return this.cal.primary;
	}
	public get defaultReminders() {
		return this.cal.defaultReminders;
	}
	public get owner() {
		return this.cal.owner;
	}
	public get me() {
		return this.myprofile;
	}
}
