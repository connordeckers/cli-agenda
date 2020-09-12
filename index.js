"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blessed_1 = require("blessed");
const window = blessed_1.screen({ smartCSR: true });
window.title = "A Window Title Exists Here";
const container = blessed_1.box({
    top: "center",
    left: "center",
    width: "80%",
    height: "80%",
    content: "Hello {bold}world{/bold}!",
    tags: true,
    border: {
        type: "line",
    },
    style: {
        fg: "white",
        bg: "magenta",
        border: { fg: "#f0f0f0" },
        hover: { bg: "green" },
    },
});
window.append(container);
container.on("click", (data) => {
    container.setContent("{center}Some different {red-fg}content{/red-fg}.{/center}");
    window.render();
});
container.key("enter", (ch, key) => {
    container.setContent("{right}Even more {black-fg}different content{/black-fg}.{/right}");
    container.setLine(1, "bar");
    container.insertLine(1, "foo");
    window.render();
});
// Handle exiting on Esc, Q or Ctrl+C
window.key(["escape", "q", "C-c"], (ch, key) => process.exit(0));
container.focus();
window.render();
