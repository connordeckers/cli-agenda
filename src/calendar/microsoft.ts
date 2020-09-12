import credentials from "../credentials/microsoft.json";
import {OAuth2} from "../OAuth2";
import request from "superagent";
import {OdataQuery} from "../types/OdataQuery";
import {Calendar, Event} from "@microsoft/microsoft-graph-types";

interface MSResponse<T> {
	"@odata.context": string;
	value: T;
}
type Maybe<T> = Promise<T | null>;

export class MicrosoftCalendar {
	private auth: OAuth2;
	readonly scopes = [
		"email",
		"openid",
		"profile",
		"User.Read",
		"offline_access",
		"Calendars.Read",
	];

	private base = "https://graph.microsoft.com/v1.0";
	private async get<T = any>(
		url: string,
		query: OdataQuery = {}
	): Maybe<MSResponse<T>> {
		try {
			const auth = await this.auth
				.GetAccessToken()
				.then((d) => d?.access_token)
				.catch((e) => null);
			if (!auth) throw new Error("Could not fetch token");

			const d = await request
				.get(url.startsWith("/") ? `${this.base}${url}` : url)
				.auth(auth, {type: "bearer"})
				.query(query);
			return d.ok ? (d.body as MSResponse<T>) : null;
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	constructor() {
		this.auth = new OAuth2({
			AuthURL: credentials.auth_uri,
			TokenURL: credentials.token_uri,
			ClientID: credentials.client_id,
			ClientSecret: credentials.client_secret,
			Scope: this.scopes,
			AdditionalParams: {response_mode: "query"},
			ServiceID: "msal",
			SendAsJSON: false,
		});
	}

	async Calendar(id: string, query?: OdataQuery) {
		return this.get<Calendar[]>(`/me/calendars/${id}`, query);
	}

	async Calendars(query?: OdataQuery) {
		return this.get<Calendar[]>("/me/calendars", query);
	}

	async Event(calendar: string, event: string, query?: OdataQuery) {
		return this.get<Event[]>(
			`/me/calendars/${calendar}/events/${event}`,
			query
		);
	}

	async Events(calendar: string, query?: OdataQuery) {
		return this.get<Event[]>(`/me/calendars/${calendar}/events`, query);
	}
}
