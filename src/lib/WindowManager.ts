import {v4 as uuid} from "uuid";
import {Widgets, screen} from "blessed";
type Screen = Widgets.Screen;
type Element = Widgets.BlessedElement;

export class WindowManager {
	private elements: Element[] = [];

	private win: Screen;
	public get window() {
		return this.win;
	}

	constructor(opts: Widgets.IScreenOptions = {}) {
		this.win = screen(opts);
	}

	public register(element: Element): string {
		// Set this element a unique key, if it doesn't already exist.
		element.data.key ??= uuid();
		this.elements.push(element);
		return element.data.key;
	}

	public display(element: string | Element) {
		const scr =
			typeof element === "string"
				? this.elements.find((s) => s.data.key == element)
				: element;

		if (!scr) {
			console.error("Could not find element ", element);
			return false;
		}
	}
}
