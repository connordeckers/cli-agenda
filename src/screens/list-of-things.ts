import {list, Widgets} from "blessed";

export default (window: Widgets.Screen) => {
	const DummyItems = (items: number) =>
		Array(items)
			.fill(null)
			.map((_, i) => `Item ${i + 1}`);

	const entries = list({
		screen: window,
		top: "center",
		left: "center",
		width: "100%",
		height: "100%",
		mouse: true,
		border: {type: "line"},
		style: {
			selected: {fg: "red"},
			item: {fg: "green"},
		},
		items: DummyItems(20),
		keys: false,
		vi: false,
	});

	window.key("up", (ch, key) => {
		entries.up(1);
		window.render();
	});

	window.key("down", (ch, key) => {
		entries.down(1);
		window.render();
	});

	window.key("space", (e) => {
		entries.pick(console.log);
	});

	return entries;
};
