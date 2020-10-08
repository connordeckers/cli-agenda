import { box, Widgets } from 'blessed';
import chalk from 'chalk';
import { v4 as uuid } from 'uuid';
import { AsStyleObj, Helpers } from '../lib/Utils';
import { Component } from '../lib/WindowManager';

export interface RowDef {
  title: string;
  time?: string;
  location?: string;
  calendarName?: string;
}

interface Props {
  items: RowDef[];
}

export class EventList extends Component {
  id = uuid();

  private items: RowDef[] = [];
  private rows: Widgets.BoxElement[] = [];
  private selected: number = -1;

  constructor(props: Props, layout?: Widgets.BoxOptions) {
    super();
    this.items = props.items;
    this.renderer = box({
      ...layout,
      style: {
        ...layout?.style,
        standard: undefined,
        selected: { bg: '#555', fg: 'white' },
      },
      scrollable: true,
    });

    this.registerKeyBinding('up', this.onUp.bind(this));
    this.registerKeyBinding('down', this.onDown.bind(this));
  }

  /** Appends a row to the list */
  private appendRow(props: RowDef) {
    const r = box({
      height: 4,
      top: this.rows.length * 3,
      border: { type: 'line' },
      focusable: true,
    });

    r.$.selected = false;

    const title = box({
      shrink: true,
      content: chalk.white(chalk.bold(props.title ?? '')),
      top: 0,
      left: 0,
      height: 1,
    });

    const time = box({
      shrink: true,
      content: chalk.grey(props.time ?? ''),
      top: 1,
      left: 0,
      height: 1,
    });

    const location = box({
      shrink: true,
      content: chalk.grey(props.location ?? ''),
      top: 1,
      right: 0,
      height: 1,
      align: 'right',
    });

    const calendarName = box({
      shrink: true,
      content: chalk.grey(props.calendarName ?? ''),
      top: 0,
      right: 0,
      height: 1,
      align: 'right',
    });

    r.append(title);
    r.append(time);
    r.append(location);
    r.append(calendarName);

    this.rows.push(r);
    this.renderer.append(r);
  }

  /** Select an item */
  private select(index: number) {
    if (this.rows.length == 0) return;

    const i = Helpers.Math.Contain(index, 0, this.rows.length - 1);
    const row = this.rows[i];
    if (!row) return;

    row.focus();
    // row.scroll(this.selected - i);

    (this.renderer as any).scrollTo(row.top);

    const prev = this.rows.find((r) => r.$.selected);
    if (prev) {
      prev.$.selected = false;
      prev.style = AsStyleObj({});
    }

    row.$.selected = true;
    row.style = AsStyleObj(this.renderer.style.selected ?? {});
    this.selected = i;

    this.refresh();
  }

  /** Perform a full refresh of the screen. */
  public render() {
    this.rows.forEach((r) => r.destroy());
    this.rows = [];

    this.items.forEach(this.appendRow);
    this.select(this.selected);
    this.refresh();
  }

  /** Append rows to the end of the list. */
  public addRows(rows: RowDef[]) {
    rows.forEach((row) => {
      this.items.push(row);
      this.appendRow(row);
    });

    if (this.selected == -1) this.select(this.selected);

    this.refresh();
  }

  private onUp() {
    this.select(this.selected - 1);
  }

  private onDown() {
    this.select(this.selected + 1);
  }

  // private onSelect() {
  //   this.toggleItem();
  // }

  onComponentMount() {
    super.onComponentMount();
    this.render();
  }
}
