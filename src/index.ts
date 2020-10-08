import { Console } from 'console';
import fs from 'fs';
import { WindowManager } from './lib/WindowManager';
import { AddAccount, Main, RemoveAccount, SelectCalendars } from './screens';

const debug = new Console({
  stdout: fs.createWriteStream('./stdout.log'),
  stderr: fs.createWriteStream('./stderr.log'),
});
console = debug;

const WM = new WindowManager({ smartCSR: true, dockBorders: true });
const window = WM.window;
window.title = 'TermAgenda';

WM.register(Main);
WM.register(AddAccount);
WM.register(RemoveAccount);
WM.register(SelectCalendars);
WM.display(0);
