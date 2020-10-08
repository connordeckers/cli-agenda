export const BoxLayout = {
	top: "0",
	left: "center",
	width: "100%",
	height: "100%-2",
	padding: 0,
	tags: true,
	border: {
		type: "line",
	},
	loader: {
		fg: "white",
		border: {fg: "#f0f0f0"},
	},
} as const;

export const InstructionsBoxLayout = {
	bottom: 1,
	left: 2,
	right: 2,
	width: "100%",
	height: 1,
	tags: true,
} as const;

export const WindowLayout = {
	top: "center",
	left: "center",
	width: "100%",
	height: "100%",
	tags: true,
} as const;

export const Loader = {
	loader: "dots",
	bottom: 1,
	right: 1,
	height: 1,
	width: 1,
	style: {fg: "green"},
} as const;

export const KeytarName = process.env.npm_package_name ?? "cli-agenda";
