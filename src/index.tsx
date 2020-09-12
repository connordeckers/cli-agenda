import {MicrosoftCalendar} from "./calendar/microsoft";
import blessed from "blessed";
import {Console} from "console";
import fs from "fs";

import welcome from "./screens/welcome";
import list from "./screens/list-of-things";
import form from "./screens/form";

const debug = new Console({
	stdout: fs.createWriteStream("./stdout.log"),
	stderr: fs.createWriteStream("./stderr.log"),
});
console = debug;

const window = blessed.screen({smartCSR: true});
window.title = "A Window Title Exists Here";

const screens = {
	welcome: welcome(window),
	list: list(window),
	form: form(window),
};

const ChangeScreen = (screen: blessed.Widgets.BlessedElement) => {
	if (screen == window.screen.data.current) return;

	if (window.screen.data.current)
		(window.screen.data.current as blessed.Widgets.BlessedElement).destroy();
	window.append(screen);
	screen.focus();
	window.render();
	window.screen.data.current = screen;
};

// Handle exiting on Esc, Q or Ctrl+C
window.key(["escape", "q", "C-c"], (ch, key) => process.exit(0));
window.key("1", () => ChangeScreen(screens.welcome));
window.key("2", () => ChangeScreen(screens.list));
window.key("3", () => ChangeScreen(screens.form));

ChangeScreen(screens.welcome);
