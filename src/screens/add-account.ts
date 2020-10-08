import { box, Widgets } from 'blessed';
import { v4 as uuid } from 'uuid';
import { CheckableList } from '../components/CheckableList';
import { MicrosoftCalendar } from '../calendar/microsoft';
import { GoogleCalendar } from '../calendar/google';
import { Component } from '../lib/WindowManager';
import { BoxLayout, InstructionsBoxLayout, WindowLayout } from '../lib/Config';

const AuthPlatforms = {
  ms: MicrosoftCalendar,
  google: GoogleCalendar,
} as const;

export class AddAccount extends Component {
  id = 'add-auth';
  renderer = box(WindowLayout);

  private options: CheckableList;
  private info: Widgets.BoxElement;
  private instructions: Widgets.BoxElement;

  constructor() {
    super();

    this.options = new CheckableList({
      ...BoxLayout,
      itemStyle: { focus: { bg: 'grey' } },
      items: [
        { key: 'google', value: 'Google Calendar' },
        { key: 'ms', value: 'Microsoft Calendar' },
      ],
    });

    this.info = box(BoxLayout);

    const instructions = [
      '[c] go back',
      '[space] toggle platform',
      '[enter] start sign in',
    ];

    this.instructions = box(InstructionsBoxLayout);
    this.instructions.setContent(instructions.join('\t'));

    this.registerKeyBinding('c', (e) => {
      this.wm.goBack();
    });

    this.registerKeyBinding('enter', async (e) => {
      if (this.options.selected.length > 0) {
        this.options.disconnect();
        this.renderer.append(this.info);
        this.info.setContent(
          'Please check your browser for sign in request(s)...'
        );

        await Promise.all(
          this.options.selected.map((key) =>
            AuthPlatforms[key as keyof typeof AuthPlatforms].register(uuid())
          )
        );
      }
      this.wm.display('main-window');
    });
  }

  onComponentRegister() {
    super.onComponentRegister();

    this.renderer.append(this.instructions);
  }

  onComponentMount() {
    super.onComponentMount();

    this.options.connect(this);
    this.renderer.append(this.options.renderer);
    this.options.render();
    this.refresh();
  }

  onComponentUnmount() {
    super.onComponentUnmount();
    this.options.disconnect();
  }
}
