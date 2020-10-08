import {Widgets, box} from "blessed";
import {v4 as uuid} from "uuid";
import {Component, WindowManager} from "../lib/WindowManager";
import loaders from "../loaders.json";

type Style = keyof typeof loaders;

interface Options extends Widgets.BoxOptions {
	loader: Style;
	interval?: number;
}

const sleep = (duration: number) =>
	new Promise((res) => setTimeout(res, duration));

export class LoadingIcon extends Component {
	id = uuid();

	private get container() {
		return this.renderer;
	}
	private opts: Options;

	constructor(opts: Options) {
		super();
		this.opts = opts;
		this.renderer = box(opts);
	}

	hide() {
		this.renderer.hidden = true;
	}
	show() {
		this.renderer.hidden = false;
	}

	async render() {
		let frame = 0;
		while (true) {
			const frames = loaders[this.opts.loader].frames;
			this.container.setContent(frames[frame % frames.length]);
			this.refresh();
			frame++;

			await sleep(this.opts.interval ?? loaders[this.opts.loader].interval);
		}
	}

	onComponentMount() {
		super.onComponentMount();
		this.render();
	}
}
