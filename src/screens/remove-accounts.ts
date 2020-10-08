import {box, Widgets} from "blessed";
import keytar from "keytar";
import {CheckableList} from "../components/CheckableList";
import {Instructions} from "../components/InstructionsBar";
import {BoxLayout, KeytarName, WindowLayout} from "../lib/Config";
import {Component} from "../lib/WindowManager";
import {OAuth2Token} from "../OAuth2";

export class RemoveAccount extends Component {
	id = "remove-auth";
	renderer = box(WindowLayout);

	private options!: CheckableList;
	private info: Widgets.BoxElement;
	private instructions: Instructions;

	constructor() {
		super();

		this.instructions = new Instructions({
			commands: {
				default: [
					{
						key: "c",
						text: "go back",
						callback: () => this.wm.goBack(),
					},
					{
						key: "d",
						text: "delete selected",
						callback: () => this.instructions.setLayer("confirm"),
					},
				],
				confirm: [
					{
						key: "c",
						text: "cancel",
						callback: () => this.instructions.setLayer("default"),
					},
					{
						key: "backspace",
						text: "confirm delete",
						callback: () => this.deleteSelected(),
					},
				],
			},
		});

		this.info = box(BoxLayout);
		this.info.setContent("Loading...");
	}

	private async deleteSelected() {
		await Promise.all(
			this.options.selected.map((acc) =>
				keytar.deletePassword(KeytarName, acc)
			)
		);
		this.wm.goBack();
	}

	async onComponentRegister() {
		super.onComponentRegister();

		this.instructions.connect(this);

		const accounts: {
			account: string;
			password: OAuth2Token;
		}[] = await keytar
			.findCredentials(KeytarName)
			.then((d) => d.map((d) => ({...d, password: JSON.parse(d.password)})));

		this.options = new CheckableList({
			...BoxLayout,
			itemStyle: {focus: {bg: "grey"}},
			items: accounts.map(({account}) => ({key: account, value: account})),
		});

		this.renderer.append(this.options.renderer);
		this.renderer.append(this.instructions.renderer);
	}

	onComponentMount() {
		super.onComponentMount();

		this.options.connect(this);
		this.options.render();
		this.refresh();
	}

	onComponentUnmount() {
		super.onComponentUnmount();
		this.options.disconnect();
	}
}
