import { box, Widgets } from 'blessed';
import { exec } from 'child_process';
import { v4 as uuid } from 'uuid';
import { AsStyleObj, Helpers } from '../lib/Utils';
import { Component } from '../lib/WindowManager';

export interface RowDef {
	id: string;
	title: string;
	time?: string;
	location?: string;
	calendarName?: string;
}

interface Props {
	items: RowDef[];
	onEnter?: (id: string) => void;
}

const RowHeight = 3;

export class EventList extends Component {
	id = uuid();

	private items: RowDef[] = [];
	private rows: Widgets.BoxElement[] = [];
	private selected: number = -1;

	constructor(props: Props, layout?: Widgets.BoxOptions) {
		super();
		this.items = props.items;
		this.renderer = box({
			...layout,
			style: {
				...layout?.style,
				standard: { fg: 'grey' },
				selected: { bg: '#555', fg: 'white' },
			},
			scrollable: true,
		});

		this.registerKeyBinding('up', this.onUp.bind(this));
		this.registerKeyBinding('down', this.onDown.bind(this));
	}

	/** The id of the currently highlighted item in the list. */
	public get selectedItem(): string | null {
		return this.rows[this.selected]?.data.id;
	}

	/** Appends a row to the list */
	private appendRow(props: RowDef) {
		const r = box({
			height: RowHeight - 1,
			focusable: true,
			tags: true,
			transparent: true,
			content: `{white-fg}{bold}${props.title ?? ''}{/}{|}${props.calendarName ?? ''}\n${props.time ?? ''}{|}${
				props.location ?? ''
			}\n`,
			style: this.renderer.style.standard ?? undefined,
		});

		r.position.top = this.rows.length * RowHeight;
		r.data.selected = false;
		r.data.id = props.id;

		this.rows.push(r);
		this.renderer.append(r);
	}

	/** Select an item */
	private select(index: number) {
		if (this.rows.length == 0) return;

		const i = Helpers.Math.Contain(index, 0, this.rows.length);

		const ScrollingDown = i > this.selected;

		if (i < this.rows.length) {
			const row = this.rows[i];

			const prev = this.rows.find((r) => r.data.selected);
			if (prev) {
				prev.data.selected = false;
				prev.style = AsStyleObj(this.renderer.style.standard ?? {});
			}

			row.data.selected = true;
			row.style = AsStyleObj(this.renderer.style.selected ?? {});
			this.selected = i;
		}

		(this.renderer as Widgets.ScrollableBoxElement).scrollTo(i * RowHeight + (ScrollingDown ? RowHeight - 1 : 0));
		this.refresh();
	}

	/** Perform a full refresh of the screen. */
	public draw() {
		this.rows.forEach((r) => r.destroy());
		this.rows = [];

		this.items.forEach(this.appendRow);
		this.refresh();
	}

	public render() {
		this.select(Math.max(this.selected, 0));
		this.refresh();
	}

	/** Append rows to the end of the list. */
	public addRows(rows: RowDef[]) {
		rows.forEach((row) => {
			this.items.push(row);
			this.appendRow(row);
		});

		if (this.selected == -1) this.select(this.selected);

		this.refresh();
	}

	public clearList() {
		this.items = [];
		this.draw();
		this.select(this.selected);
		this.refresh();
	}

	private onUp() {
		this.select(this.selected - 1);
	}

	private onDown() {
		this.select(this.selected + 1);
	}

	onComponentMount() {
		super.onComponentMount();
		this.render();
	}

	onComponentUnmount() {
		super.onComponentUnmount();
	}
}
