import { box, Widgets } from 'blessed';
import keytar from 'keytar';
import { getCalendarObj, IdentifyCalAccount } from '../calendar/Calendar';
import { CheckableList } from '../components/CheckableList';
import { LoadingIcon } from '../components/Loader';
import {
  BoxLayout,
  InstructionsBoxLayout,
  KeytarName,
  Loader,
  WindowLayout,
} from '../lib/Config';
import { IsNotNull } from '../lib/Utils';
import { Component } from '../lib/WindowManager';
import { OAuth2Token } from '../OAuth2';
import { LocalStorage } from '../lib/Storage';

export class SelectCalendars extends Component {
  id = 'select-calendars';
  renderer = box(WindowLayout);

  private options: CheckableList;
  private info: Widgets.BoxElement;
  private instructions: Widgets.BoxElement;
  private loader: LoadingIcon;

  constructor() {
    super();

    this.options = new CheckableList({
      ...BoxLayout,
      itemStyle: { focus: { bg: '#333' } },
      items: [],
    });

    this.info = box(BoxLayout);
    this.loader = new LoadingIcon(Loader);

    const instructions = [
      '[c] go back',
      '[space] toggle calendar',
      '[enter] save',
    ];

    this.instructions = box(InstructionsBoxLayout);
    this.instructions.setContent(instructions.join('\t'));

    this.registerKeyBinding('c', (e) => {
      this.wm.goBack();
    });

    this.registerKeyBinding('enter', async (e) => {
      if (this.options.selected.length > 0) {
        await keytar.setPassword(
          KeytarName,
          '__store',
          JSON.stringify({
            calendars: this.options.selected.map((str) => {
              const [cal, acc] = str.split('--');
              return { account: acc, id: cal };
            }),
          })
        );
      }
      this.wm.display('main-window');
    });
  }

  private async savedCalendars() {
    const storage = await LocalStorage.get();
    return storage.calendars;
  }

  private async fetchCalendars() {
    try {
      this.loader.show();

      const credentials = await keytar
        .findCredentials(KeytarName)
        .then((d) => d.filter(({ account }) => account != '__store'))
        .then((d) =>
          d.map(({ account, password }) => ({
            account,
            password: JSON.parse(password) as OAuth2Token,
          }))
        );

      const idMap: Map<string, string> = new Map();
      const calendars = await Promise.all(
        credentials.map(async ({ account }) => {
          const cal = await IdentifyCalAccount(account).then((d) =>
            d?.fetchAll(account)
          );
          cal?.forEach((c) => idMap.set(c.id, account));
          return cal;
        })
      ).then((d) => d.flat().filter(IsNotNull));

      const saved = await this.savedCalendars().then((d) => d.map((v) => v.id));

      if (calendars.length == 0) {
        this.info.setContent(
          `No calendars found. \n\nPlease press [s] > [a] to add one or more accounts.`
        );
        this.options.disconnect();
        this.renderer.append(this.info);
      } else {
        calendars.forEach((cal) => {
          if (!cal) return;
          const id = idMap.get(cal.id);
          this.options.add({
            key: `${cal.id}--${id}`,
            value: cal.title,
            checked: saved.includes(cal.id),
          });
        });

        this.options.render();
      }
    } catch (e) {
      this.info.setContent(e.message);
      this.options.disconnect();
      this.renderer.append(this.info);
    } finally {
      this.loader.hide();
      this.refresh();
    }
  }

  onComponentRegister() {
    super.onComponentRegister();
    this.renderer.append(this.instructions);

    this.options.connect(this);
    this.renderer.append(this.options.renderer);
    this.renderer.append(this.loader.renderer);
    this.loader.connect(this);

    this.options.render();
  }

  async onComponentMount() {
    super.onComponentMount();
    this.loader.show();

    this.fetchCalendars();
  }

  onComponentUnmount() {
    super.onComponentUnmount();
    this.options.disconnect();
  }
}
