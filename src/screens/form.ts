import {form, button, checkbox, Widgets} from "blessed";

export default (window: Widgets.Screen) => {
	var f = form({
		parent: window,
		keys: true,
		left: 10,
		top: 10,
		width: "90%",
		height: "90%",
		content: "Submit or cancel?",
	});

	const cb = checkbox({
		parent: f,
		mouse: true,
		keys: true,
		shrink: true,
		padding: {
			left: 1,
			right: 1,
		},
		left: 10,
		top: 1,
		text: "A checkbox",
		checked: true,
		style: {
			bg: "blue",
			focus: {
				bg: "red",
			},
			hover: {
				bg: "red",
			},
		},
	});

	var submit = button({
		parent: f,
		mouse: true,
		keys: true,
		shrink: true,
		padding: {
			left: 1,
			right: 1,
		},
		left: 10,
		top: 10,
		name: "submit",
		content: "submit",
		style: {
			bg: "blue",
			focus: {
				bg: "red",
			},
			hover: {
				bg: "red",
			},
		},
	});

	var cancel = button({
		parent: f,
		mouse: true,
		keys: true,
		shrink: true,
		padding: {
			left: 1,
			right: 1,
		},
		left: 20,
		top: 10,
		name: "cancel",
		content: "cancel",
		style: {
			bg: "blue",
			focus: {
				bg: "red",
			},
			hover: {
				bg: "red",
			},
		},
	});

	submit.on("press", () => {
		f.submit();
	});

	cancel.on("press", () => {
		f.reset();
	});

	f.on("submit", (data: any) => {
		f.setContent("Submitted.");
		window.render();
	});

	f.on("reset", (data: any) => {
		f.setContent("Canceled.");
		window.render();
	});

	return f;
};
