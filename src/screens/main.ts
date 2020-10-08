import { box, table, Widgets } from 'blessed';
import { Calendar } from '../calendar/Calendar';
import { Event } from '../calendar/ICalendar';
import { Instructions } from '../components/InstructionsBar';
import { LoadingIcon } from '../components/Loader';
import { BoxLayout, Loader, WindowLayout } from '../lib/Config';
import { Component } from '../lib/WindowManager';
import chalk from 'chalk';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import duration from 'dayjs/plugin/duration';
import relativetime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { EventList, RowDef } from '../components/EventList';

dayjs.extend(calendar);
dayjs.extend(duration);
dayjs.extend(relativetime);
dayjs.extend(utc);
dayjs.extend(timezone);

// dayjs.updateLocale('en', {
//   weekdaysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
// });

export class Main extends Component {
  id = 'main-window';
  renderer = box(WindowLayout);

  private readonly container: Widgets.BoxElement;
  private instructions: Instructions;
  private loader: LoadingIcon;
  private today: EventList;
  private next14days: EventList;
  private hasRegisteredOnce = false;

  constructor() {
    super();

    this.container = box();
    this.instructions = new Instructions({
      commands: {
        default: [
          {
            key: 's',
            text: 'settings',
            callback: () => this.instructions.setLayer('settings'),
          },
          { key: 'r', text: 'refresh', callback: () => this.fetchCalendars() },
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
        width: '50%-4',
        height: '100%-2',
        top: 0,
        left: 0,
      }
    );
    this.next14days = new EventList(
      { items: [] },
      {
        width: '50%-4',
        height: '50%-2',
        border: { type: 'line' },
        top: 0,
        left: 0,
      }
    );
  }

  private get box() {
    return this.container;
  }

  async fetchCalendars() {
    this.loader.show();
    if (!this.hasRegisteredOnce) {
      this.box.setContent('Fetching...');
      this.refresh();
    }

    try {
      // const calendars = await Calendar.GetAll();

      // if (calendars.length == 0) {
      //   this.box.setContent(
      //     `No calendars found. \n\nPlease press [s] > [a] to add one or more accounts.`
      //   );
      //   this.refresh();
      //   this.loader.hide();
      //   return;
      // }

      // this.box.setContent('');

      const rows: RowDef[] = [];

      // const events = await Promise.all(
      //   calendars.map((cal) => cal.today())
      // ).then((d) => d.flat());

      let event: Partial<Event> = {
        name: 'Test event',
        calendar: {
          id: '--test--',
          owner: {
            email: 'test@user',
            name: 'Test User',
            self: true,
          },
          defaultReminders: [],
          description: '',
          hidden: false,
          primary: true,
          timeZone: '',
          title: 'Test Calendar',
        },
        location: {
          displayName: 'Zoom',
          isOnline: true,
          location: 'https://utas.zoom.us/j/somethingrandom',
        },
        start: new Date(2020, 1, 1, 10, 0, 0, 0).toISOString(),
        end: new Date(2020, 1, 1, 10, 15, 0, 0).toISOString(),
      };

      const TestEvents = 40;
      const events = Array(TestEvents)
        .fill(0)
        .map((_, i) => {
          let ev = { ...event };
          ev.name += ` ${i + 1}`;
          return ev;
        }) as Required<Event>[];

      events
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
            time: AllDay
              ? `${start.format('ddd, MMM DD')} (All Day)`
              : `${start.format(
                  'ddd MMM DD, hh:mma'
                )} (${duration.humanize()})`,
            title: evt.name,
            location: evt.location.displayName,
            calendarName: `${evt.calendar.title} (${evt.calendar.owner.email})`,
          });
        });

      this.today.addRows(rows);
    } catch (e) {
      this.box.setContent(e.message);
    }

    this.refresh();
    this.loader.hide();
  }

  render() {
    this.fetchCalendars();
  }

  onComponentRegister() {
    super.onComponentRegister();

    this.today.connect(this);
    this.loader.connect(this);
    this.instructions.connect(this);
    this.renderer.append(this.container);
    this.renderer.append(this.today.renderer);
    this.renderer.append(this.instructions.renderer);
    this.renderer.append(this.loader.renderer);
  }

  onComponentMount() {
    this.render();
    this.hasRegisteredOnce = true;
  }
}
