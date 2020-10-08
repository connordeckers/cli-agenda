import { box, Widgets } from 'blessed';
import { v4 as uuid } from 'uuid';
import { Helpers } from '../lib/Utils';
import { Component } from '../lib/WindowManager';
type Element = Widgets.BlessedElement;

export interface CheckableItem {
  value: string;
  key: string;
  checked?: boolean;
}

interface Options extends Widgets.BoxOptions {
  items: CheckableItem[];
  itemStyle: Record<string, any>;
}

export class CheckableList extends Component {
  id = uuid();
  private _rows: Map<string, Element> = new Map();
  private _items: Map<string, CheckableItem> = new Map();

  private selectedIndex = -1;

  private get rowsArray(): Element[] {
    return Array.from(this._rows.values());
  }

  private get container() {
    return this.renderer;
  }

  public get selected() {
    return Array.from(this._rows.entries())
      .filter(([k, v]) => v.data.selected)
      .map(([k]) => k);
  }

  private opts?: Options;

  constructor(opts?: Options) {
    super();
    this.opts = opts;
    this.renderer = box({
      ...(opts ?? {}),
      keys: true,
      keyable: true,
      focusable: true,
      scrollable: true,
    });

    opts?.items.forEach((item) => this._items.set(item.key, item));
    this.renderItems();

    this.registerKeyBinding('up', this.onUp.bind(this));
    this.registerKeyBinding('down', this.onDown.bind(this));
    this.registerKeyBinding('space', this.onSelect.bind(this));
  }

  private renderItems() {
    for (const [key, item] of this._items) {
      // If the row has already been rendered, ignore it.
      if (this._rows.has(key)) {
        continue;
      }

      const row = box({
        content: `[${item.checked ? 'x' : ' '}] ${item.value}`,
        style: { ...this.opts?.itemStyle },
        focusable: true,
        clickable: true,
        height: 1,
      });
      row.data.selected = item.checked;
      row.position.top = this._rows.size;
      this.container.append(row);
      this._rows.set(key, row);
    }
  }

  private toggleItem() {
    const item = this.rowsArray[this.selectedIndex];
    if (!item) return;

    item.data.selected = !item.data.selected;
    item.setContent(
      `[${item.data.selected ? 'x' : ' '}] ${item.getContent().substr(4)}`
    );
    this.refresh();
  }

  private selectItem(index: number) {
    if (this._rows.size == 0) return;

    const target = Helpers.Math.Contain(index, 0, this._rows.size - 1);

    this.selectedIndex = target;
    this.rowsArray[target].focus();
    (this.container as any).scrollTo(target);
    this.refresh();
  }

  private onUp() {
    this.selectItem(this.selectedIndex - 1);
  }

  private onDown() {
    this.selectItem(this.selectedIndex + 1);
  }

  private onSelect() {
    this.toggleItem();
  }

  public add(item: CheckableItem) {
    this._items.set(item.key, item);
    this.renderItems();
  }

  public remove(key: string) {
    this._items.delete(key);
    this.renderItems();
  }

  render() {
    this.selectItem(Math.max(this.selectedIndex, 0));
    this.refresh();
  }

  clear() {
    this._items.clear();
    this._rows.forEach((el) => el.destroy());
    this._rows.clear();
    this.refresh();
  }

  onComponentMount() {
    super.onComponentMount();
    this.render();
  }
}
