import {box} from "blessed";
import {v4 as uuid} from "uuid";
import {InstructionsBoxLayout} from "../lib/Config";
import {Component, KeyEvent} from "../lib/WindowManager";

interface Instruction {
	key: string;
	text: string;
	callback: KeyEvent;
}

interface Props {
	commands:
		| Instruction[]
		| {
				default: Instruction[];
				[key: string]: Instruction[];
		  };
}

export class Instructions extends Component {
	id = uuid();
	renderer = box(InstructionsBoxLayout);

	private layers: Record<string, Instruction[]>;
	private currentLayer: Instruction[] = [];

	private getCommandLayer(layer: string) {
		return this.layers[layer];
	}

	constructor(props: Props) {
		super();

		this.layers = Array.isArray(props.commands)
			? {default: props.commands}
			: props.commands;
	}

	public setLayer(layer: string) {
		this.deregisterCurrentKeyBinds();

		const commands = this.getCommandLayer(layer);
		this.renderer.setContent(
			commands.map((cmd) => `[${cmd.key}] ${cmd.text}`).join("\t")
		);

		commands.forEach((cmd) => {
			this.window.key(cmd.key, cmd.callback);
		});

		this.refresh();
		this.currentLayer = commands;
	}

	private deregisterCurrentKeyBinds() {
		this.currentLayer.forEach(({key, callback}) => {
			this.window.unkey(key, callback);
		});
	}

	connect(frame: Component) {
		super.connect(frame);
		const old = frame.onComponentMount;
		frame.onComponentMount = (...args) => {
			old.apply(frame, args);
			this.setLayer("default");
		};
	}

	onComponentRegister() {
		this.setLayer("default");
	}

	onComponentUnmount() {
		this.deregisterCurrentKeyBinds();
	}
}
