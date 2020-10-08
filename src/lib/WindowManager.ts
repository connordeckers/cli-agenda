import { screen, Widgets } from "blessed";
import { v4 as uuid } from "uuid";
type Screen = Widgets.Screen;

const elements: Component[] = [];
let curr: Component | null = null;

export class WindowManager {
  private readonly exitKeys: string[] = [];
  private readonly win: Screen;
  private stack: string[] = [];
  public get window() {
    return this.win;
  }

  constructor(opts: Widgets.IScreenOptions & { exitKeys?: string[] } = {}) {
    this.win = screen(opts);
    this.exitKeys = opts.exitKpeys ?? ["q", "C-c"];
    this.win.key(this.exitKeys, () => process.exit(0));

    this.win.key('escape', () => {
      if (curr?.id != 'main-window') this.show('main-window');
    });
  }

  public register(element: typeof Component): string {
    // Set this element a unique key, if it doesn't already exist.
    const el = element.register(this);
    el.id ||= uuid();
    elements.push(el);
    el.onComponentRegister();
    console.log(`Element registered with id "${el.id}"`);
    return el.id;
  }

  private show(element: string | Component | number) {
    // Either pass the element directly, or pass the key of the item.
    // This can either be manually created, or a generated UUID when the element was registered.
    const scr =
      typeof element === "string"
        ? elements.find((s) => s.id == element)
        : typeof element === "number"
          ? elements[element]
          : element

    // If the screen component wasn't found, bail.
    if (!scr) {
      console.error("Could not find element ", element);
      return false;
    }

    // If this is the same as our current screen, do nothing.
    if (scr == curr) return false;

    // Inform the old component that it's unmounting.
    curr?.onComponentUnmount();
    // Destroy the current screen element.
    curr?.renderer.destroy();
    // Attach our new screen element.
    this.window.append(scr.renderer);
    // Focus the new element.
    scr.renderer.focus();
    // Render the window with the new content.
    this.window.render();
    // Store the new screen element for next time.
    curr = scr;
    // Inform the new component that it was mounted.
    curr.onComponentMount();

    return scr.id;
  }

  public goBack(exitOnEmptyStack = false): void {
    const prev = this.stack.pop();
    if (!prev) {
      if (exitOnEmptyStack) return process.exit(0);

      this.show(0);
    } else {
      this.show(prev);
    }
  }

  /** Display a component based on the order it was added in (0-offset indexing). */
  public display(index: number): void;
  /** Pass a component to display. */
  public display(element: Component): void;
  /** Display a component based on its key (either manually provided, or generated on registration). */
  public display(key: string): void;
  public display(element: string | Component | number) {
    const screen = this.show(element);
    if (screen) this.stack.push(screen);
  }
}

export type KeyEvent = (e?: {
  ch: any;
  key: Widgets.Events.IKeyEventArg;
}) => void;

export class Component {
  /** The ID of this window. */
  public id: string = "";
  /**
   * The base renderer for this window (usually a box of some sort.)
   * Can be thought of as the "<body>" for this screen.
   */
  public renderer!: Widgets.BlessedElement;

  /** A reference to the main WindowManager. */
  public wm!: WindowManager;

  /** The root screen object. */
  public get window(): Screen {
    return this.wm.window;
  }

  /**
   * Register key bindings per component.
   * These are automatically registered on componentMount, and de-registered on componentUnmount to prevent memory leaks.
   */
  protected keyBindings: Map<string, KeyEvent> = new Map();

  constructor() { }

  static register(wm: WindowManager) {
    const el = new this();
    el.wm = wm;
    return el;
  }

  connect(frame: Component) {
    this.wm = frame.wm;
    this.onComponentRegister();
    this.onComponentMount();
  }

  disconnect() {
    this.onComponentUnmount();
  }

  /** Handle screen render logic. Called when component registered. */
  render(): void { }
  /** When the component mounted to the screen. */
  onComponentMount(): void {
    this.keyBindings.forEach((cb, key) => {
      this.window.key(key, cb.bind(this));
    });
  }
  /** When the component is unmounted from the screen. */
  onComponentUnmount(): void {
    this.keyBindings.forEach((cb, key) =>
      this.window.unkey(key, cb.bind(this))
    );
  }

  /** When the component is registered into the window manager. */
  onComponentRegister(): void { }
  /** Register a callback to a keypress. */
  registerKeyBinding(key: string, cb: KeyEvent): void;
  /** Register a callback to multiple keys. */
  registerKeyBinding(keys: string[], cb: KeyEvent): void;
  registerKeyBinding(keys: string | string[], cb: KeyEvent): void {
    let k = Array.isArray(keys) ? keys : [keys];
    k.forEach((kb) => this.keyBindings.set(kb, cb));
  }

  /** Deregister a callback to a keypress. */
  deregisterKeyBinding(key: string, cb: KeyEvent): void;
  /** Deregister a callback to multiple keys. */
  deregisterKeyBinding(keys: string[], cb: KeyEvent): void;
  deregisterKeyBinding(keys: string | string[], cb: KeyEvent): void {
    let k = Array.isArray(keys) ? keys : [keys];
    k.forEach((kb) => this.window.unkey(kb, cb));
  }

  public refresh() {
    return this.window.render();
  }
}
