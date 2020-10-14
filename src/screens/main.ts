import { box, Widgets } from 'blessed';
import { exec } from 'child_process';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import duration from 'dayjs/plugin/duration';
import relativetime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import open from 'open';
import { URL } from 'url';
import { Calendar, TCal } from '../calendar/Calendar';
import { Event } from '../calendar/ICalendar';
import { EventList, RowDef } from '../components/EventList';
import { Instructions } from '../components/InstructionsBar';
import { LoadingIcon } from '../components/Loader';
import { Loader, WindowLayout } from '../lib/Config';
import { Component } from '../lib/WindowManager';
import cron from 'node-cron';

dayjs.extend(calendar);
dayjs.extend(duration);
dayjs.extend(relativetime);
dayjs.extend(utc);
dayjs.extend(timezone);

export class Main extends Component {
	id = 'main-window';
	renderer = box(WindowLayout);

	private readonly container: Widgets.BoxElement;
	private instructions: Instructions;
	private loader: LoadingIcon;
	private today: EventList;
	// private next14days: EventList;
	private calendars: TCal[] = [];
	private events: Event[] = [];

	constructor() {
		super();

		this.container = box({ scrollable: false });
		this.instructions = new Instructions({
			commands: {
				default: [
					{
						key: 's',
						text: 'settings',
						callback: () => this.instructions.setLayer('settings'),
					},
					{ key: 'r', text: 'refresh', callback: () => this.updateResources() },
				],
				settings: [
					{
						key: 'c',
						text: 'cancel',
						callback: () => this.instructions.setLayer('default'),
					},
					{
						key: 'a',
						text: 'add account',
						callback: () => this.wm.display('add-auth'),
					},
					{
						key: 'r',
						text: 'remove accounts',
						callback: () => this.wm.display('remove-auth'),
					},
					{
						key: 's',
						text: 'select calendars',
						callback: () => this.wm.display('select-calendars'),
					},
				],
			},
		});

		this.loader = new LoadingIcon(Loader);
		this.today = new EventList(
			{ items: [] },
			{
				width: '100%',
				// width: '50%-4',
				height: '100%-2',
				top: 0,
				left: 0,
			}
		);
		// this.next14days = new EventList(
		// 	{ items: [] },
		// 	{
		// 		width: '50%-4',
		// 		height: '50%-2',
		// 		border: { type: 'line' },
		// 		top: 0,
		// 		left: 0,
		// 	}
		// );

		this.registerKeyBinding('enter', this.onAgendaItemSelect.bind(this));
		this.registerKeyBinding('o', this.onAgendaItemOpenRequest.bind(this));

		cron.schedule('* * * * *', this.checkForNotifications.bind(this));
	}

	private get box() {
		return this.container;
	}

	private async updateResources() {
		this.loader.show();
		this.calendars = await Calendar.GetAll();
		this.events = await Promise.all(this.calendars.map((cal) => cal.today())).then((d) => d.flat());
		this.drawItems();
		this.loader.hide();
	}

	async drawItems() {
		try {
			if (this.calendars.length == 0) {
				this.box.setContent(`No calendars found. \n\nPlease press [s] > [a] to add one or more accounts.`);
				this.refresh();
				this.loader.hide();
				return;
			}

			this.box.setContent('');

			const rows: RowDef[] = [];

			this.today.clearList();
			this.events
				.sort((a, b) => {
					if (a.isAllDay) return -1;
					const astart = new Date(a.start).valueOf();
					const bstart = new Date(b.start).valueOf();
					return astart - bstart;
				})
				.forEach((evt) => {
					const start = dayjs(evt.start);
					const end = dayjs(evt.end);

					const AllDay = evt.isAllDay;
					const duration = dayjs.duration(end.diff(start));

					rows.push({
						id: evt.id,
						time: AllDay
							? `${start.format('ddd, MMM DD')} (All Day)`
							: `${start.format('ddd MMM DD, hh:mma')} (${duration.humanize()})`,
						title: evt.name,
						location: evt.location.displayName,
						calendarName: evt.calendar.title,
					});
				});

			this.today.addRows(rows);
		} catch (e) {
			this.box.setContent(e.message);
		}

		this.refresh();
	}

	render() {
		this.drawItems();
	}

	private notify(...args: string[]) {
		exec(`dunstify ${args.map((v) => `"${v}"`).join(' ')}`);
	}

	onAgendaItemSelect() {
		const id = this.today.selectedItem;
		const evt = this.events.find((evt) => evt.id == id);
		if (!evt) return this.notify('Could not find that event!');

		if (/zoom/i.test(evt.location.displayName)) {
			const u = new URL('https://utas.zoom.us/j/8307398097');
			const mtgId = u.pathname.split('/j/')[1];

			open(`zoommtg://${u.host}/join?confno=${mtgId}`);
			this.notify(`Opening ${evt.name} in Zoom`);
			return;
		}

		const start = dayjs(evt.start);
		const end = dayjs(evt.end);

		const AllDay = evt.isAllDay;
		const duration = dayjs.duration(end.diff(start));

		this.notify(
			evt.name,
			AllDay ? `${start.format('ddd, MMM DD')} (All Day)` : `${start.format('ddd MMM DD, hh:mma')} (${duration.humanize()})`
		);
	}

	onAgendaItemOpenRequest() {
		const id = this.today.selectedItem;
		const evt = this.events.find((evt) => evt.id == id);
		if (!evt?.permalink) return this.notify('Could not find a permalink to that event.');

		open(evt.permalink);
	}

	onComponentRegister() {
		super.onComponentRegister();

		this.updateResources();

		this.loader.connect(this);
		this.instructions.connect(this);
		this.renderer.append(this.container);
		this.renderer.append(this.instructions.renderer);
		this.renderer.append(this.loader.renderer);
		this.renderer.append(this.today.renderer);
		this.today.connect(this);
	}

	onComponentMount() {
		super.onComponentMount();
		this.render();
		this.box.setContent('Fetching...');
		this.refresh();
	}

	checkForNotifications() {
		this.events.forEach((evt) => {
			if (!evt.start) return;

			const diff = dayjs(evt.start).diff(dayjs(), 'minute');
			if (diff < 0) return; // Event has passed.

			if (diff == 0) this.notify(evt.name, '--NOW--');
			if (diff % 5 == 0 && diff <= 15) this.notify(evt.name, `In ${diff} minutes`); // If 5/10/15 minutes until event.
		});
	}
}
