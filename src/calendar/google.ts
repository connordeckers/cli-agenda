import credentials from "../credentials/google.json";
import {OAuth2 as OAuth2Server} from "../OAuth2";
import {google} from "googleapis";
import moment from "moment";

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

const auth = new OAuth2Server({
	AuthURL: credentials.installed.auth_uri,
	TokenURL: credentials.installed.token_uri,
	ClientID: credentials.installed.client_id,
	ClientSecret: credentials.installed.client_secret,
	Scope: SCOPES,
	AdditionalParams: {access_type: "offline"},
	ServiceID: "google-oauth2",
});

const client = new google.auth.OAuth2({
	clientId: credentials.installed.client_id,
	clientSecret: credentials.installed.client_secret,
	redirectUri: credentials.installed.redirect_uris[0],
});

(async function () {
	try {
		const token = await auth.GetAccessToken();
		if (!token) throw new Error("Error fetching Google auth token.");
		client.setCredentials(token as any);

		const calendar = google.calendar({version: "v3", auth: client});
		// const req = await calendar.calendarList.list();
		// console.log(req.data);

		const cal = await calendar.calendars.get({calendarId: "dronnoc@gmail.com"});
		const events = await calendar.events.list({
			calendarId: "dronnoc@gmail.com",
			timeMin: moment().subtract(4, "days").toISOString(),
			timeMax: moment().add(14, "days").toISOString(),
		});
		console.log(cal.data);
		console.log(events.data);
	} catch (e) {
		console.error(e);
	}
})();
