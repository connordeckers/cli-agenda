import {
  Calendar as MSCalendar,
  Event as MSEvent,
  User as MSUser,
} from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import request from 'superagent';
import credentials from '../credentials/microsoft.json';
import { OAuth2 } from '../OAuth2';
import { OdataQuery } from '../types/OdataQuery';
import { Attendee, Calendar, Event, ICalendar } from './ICalendar';

interface MSResponse<T> {
  '@odata.context': string;
  'value': T;
}
type Maybe<T> = Promise<T | null>;

const scopes = [
  'email',
  'openid',
  'profile',
  'User.Read',
  'offline_access',
  'Calendars.Read',
];

const base = 'https://graph.microsoft.com/v1.0';

/** Get something from the Graph API */
const get = async <T = any>(
  auth: OAuth2,
  url: string,
  query: OdataQuery = {}
): Maybe<MSResponse<T>> => {
  try {
    const a = await auth
      .GetAccessToken()
      .then((d) => d?.access_token)
      .catch((e) => null);
    if (!a) throw new Error('Could not fetch token');

    const d = await request
      .get(url.startsWith('/') ? `${base}${url}` : url)
      .auth(a, { type: 'bearer' })
      .query(query);
    return d.ok ? (d.body as MSResponse<T>) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
};
/** Normalize an API response to a typed JSON object. */
const parse = {
  calendar(cal: MSCalendar): Calendar {
    return {
      id: cal.id!,
      title: cal.name ?? 'Untitled Calendar',
      description: '',
      hidden: false,
      timeZone: 'Australia/Hobart',
      primary: false,
      defaultReminders: [],
      owner: {
        email: cal.owner?.address ?? '',
        name: cal.owner?.name ?? '',
        self: cal.canShare ?? true,
      },
    };
  },

  event(cal: Calendar, ev: MSEvent): Event {
    return {
      calendar: cal,
      id: ev.id!,
      name: ev.subject ?? 'Unknown Event',
      description: ev.body?.content ?? '',
      permalink: ev.webLink ?? null,
      creator: {
        name: ev.organizer?.emailAddress?.name ?? 'Unknown User',
        email: ev.organizer?.emailAddress?.address ?? '',
        self: ev.isOrganizer ?? true,
      },
      attendees:
        ev.attendees?.map(
          (att) =>
            ({
              displayName: att.emailAddress?.name ?? 'Unknown User',
              going: att.status?.response ?? 'none',
              organizer: att.status?.response === 'organizer',
              email: att.emailAddress?.address ?? '',
            } as Attendee)
        ) ?? [],
      status: (ev.responseStatus?.response as any) ?? 'none',
      created: ev.createdDateTime!,
      updated: ev.lastModifiedDateTime ?? ev.createdDateTime!,
      start: `${ev.start!.dateTime!}${
        ev.start!.dateTime!.endsWith('Z') ? '' : 'Z'
      }`,
      end: `${ev.end!.dateTime!}${ev.end!.dateTime!.endsWith('Z') ? '' : 'Z'}`,
      isAllDay: ev.isAllDay ?? false,
      location: {
        displayName: ev.location?.uniqueId?.includes('zoom')
          ? 'Zoom'
          : ev.location?.displayName ?? '',
        location: ev.location?.uniqueId ?? ev.location?.locationUri ?? '',
        isOnline: ev.location?.uniqueId?.startsWith('http') ?? false,
      },
    };
  },
};

const _auth = {
  AuthURL: credentials.auth_uri,
  TokenURL: credentials.token_uri,
  ClientID: credentials.client_id,
  ClientSecret: credentials.client_secret,
  Scope: scopes,
  AdditionalParams: { response_mode: 'query' },
  SendAsJSON: false,
  Platform: 'ms',
};

export class MicrosoftCalendar implements ICalendar {
  static async register(account: string) {
    const auth = new OAuth2({ ..._auth, ServiceID: account });
    return auth.GetAccessToken();
  }

  protected constructor(private auth: OAuth2, private cal: Calendar) {}

  private get = async <T = any>(
    url: string,
    query: OdataQuery = {}
  ): Maybe<MSResponse<T>> => get(this.auth, url, query);

  static async fetch(account: string, calendar: string) {
    const auth = new OAuth2({ ..._auth, ServiceID: account });

    const req = await get<any>(auth, `/me/calendars/${calendar}`);
    if (!req) return null;

    return new this(auth, parse.calendar(req as any));
  }

  static async fetchAll(account: string) {
    const auth = new OAuth2({ ..._auth, ServiceID: account });

    const req = await get<MSCalendar[]>(auth, `/me/calendars`);
    const cal = req?.value;
    if (!cal) return null;

    return cal.map(parse.calendar);
  }

  async event(event: string): Promise<Event | null> {
    const req = await this.get<MSEvent>(
      `/me/calendars/${this.id}/events/${event}`
    );
    const ev = req?.value;
    if (!ev) return null;

    return parse.event(this, ev);
  }

  async events(): Promise<Event[]> {
    const start = dayjs().toISOString();
    const end = dayjs().add(14, 'day').toISOString();
    const evs = await this.get<MSEvent[]>(
      `/me/calendars/${this.id}/calendarview?startdatetime=${start}&enddatetime=${end}`
    );
    if (!evs) return [];

    return evs.value.map((ev) => parse.event(this, ev));
  }

  async today(): Promise<Event[]> {
    const today = dayjs();
    const evs = await this.get<MSEvent[]>(
      `/me/calendars/${this.id}/calendarview?startdatetime=${today
        .startOf('day')
        .toISOString()}&enddatetime=${today.endOf('day').toISOString()}`
    );
    if (!evs) return [];

    return evs.value.map((ev) => parse.event(this, ev));
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
  public async me() {
    return this.get<MSUser>('/me');
  }
}
