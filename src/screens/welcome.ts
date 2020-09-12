import {box, Widgets} from "blessed";

export default (window: Widgets.Screen) => {
	const container = box({
		screen: window,
		top: "center",
		left: "center",
		width: "100%",
		height: "100%",
		content: "Hello {bold}world{/bold}!",
		tags: true,
		border: {
			type: "line",
		},
		style: {
			fg: "white",
			border: {fg: "#f0f0f0"},
		},
	});

	container.on("click", (data) => {
		container.setContent(
			"{center}Some different {red-fg}content{/red-fg}.{/center}"
		);
		window.render();
	});

	container.key("enter", (ch, key) => {
		container.setContent(
			"{right}Even more {black-fg}different content{/black-fg}.{/right}"
		);
		container.setLine(1, "bar");
		container.insertLine(1, "foo");
		window.render();
	});

	// Handle exiting on Esc, Q or Ctrl+C
	window.key(["escape", "q", "C-c"], (ch, key) => process.exit(0));

	container.focus();
	return container;
};
