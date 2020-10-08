import keytar from 'keytar';
import { KeytarName } from '../lib/Config';
import { IsNotNull } from '../lib/Utils';
import { OAuth2Token } from '../OAuth2';
import { GoogleCalendar } from './google';
import { MicrosoftCalendar } from './microsoft';

export interface SavedCalendar {
  id: string;
  account: string;
}

const tokenCache: Map<string, OAuth2Token> = new Map();
const getToken = (account: string) =>
  tokenCache.get(account) ??
  keytar.getPassword(KeytarName, account).then((d) => {
    if (!d) return null;
    const j = JSON.parse(d);
    tokenCache.set(account, j);
    return j as OAuth2Token;
  });

type TCal = MicrosoftCalendar | GoogleCalendar;

const map = {
  ms: MicrosoftCalendar,
  google: GoogleCalendar,
};

export const IdentifyCalAccount = async (account: string) => {
  const token = await getToken(account);
  if (!token) return null;
  if (!Object.keys(map).includes(token.platform)) return null;

  return map[token.platform as keyof typeof map];
};

export const getCalendarObj = async (
  account: string,
  calendar: string
): Promise<TCal | null> => {
  return (await IdentifyCalAccount(account))?.fetch(account, calendar) ?? null;
};

export class Calendar {
  static async GetAll() {
    const calendars: SavedCalendar[] = [];
    await keytar.getPassword(KeytarName, '__store').then(async (d) => {
      if (!d) return null;
      const store = JSON.parse(d);
      store.calendars.forEach((cal: SavedCalendar) => calendars.push(cal));
    });

    return Promise.all(
      calendars.map((cal) => getCalendarObj(cal.account, cal.id))
    ).then((d) => {
      const r = d.flat().filter(IsNotNull);
      // console.log(d, r);
      return r;
    });
  }
}
