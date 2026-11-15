import { useEffect, useRef } from 'preact/hooks';

/** A figure exported from Python with fig.write_json(), or lifted out of a fig.write_html() embed. */
export type PlotlyFigure = { data: object[]; layout: Record<string, any> };

interface Props {
	figure: PlotlyFigure;
	/** Accessible description of what the chart shows */
	label: string;
	/** Chart height in px (defaults to the figure's own height, else 500); the width always fills the column */
	height?: number;
	/** Overrides the figure's own margins in px, e.g. { l: 10, r: 10 }; sides left out keep the figure's value */
	margin?: { l?: number; r?: number; t?: number; b?: number };
	/** Restyle the figure like the site's ECharts charts: site font and colours, and no Plotly title
	    (put the title and subtitle on the surrounding <Figure> instead) */
	matchSite?: boolean;
	/** Keep the figure's own title and layout, but use the site font everywhere and give the title the
	    same size and weight as the site's figure headings (e.g. the sleep-cycles chart titles) */
	siteFont?: boolean;
}

// Site palette and font, same values as components/cinema/echarts.ts (not imported, so ECharts stays out of this bundle)
const ink = '#222939';
const muted = '#60739f';
const font = "'Host Grotesk', 'Atkinson', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function siteStyled({ data, layout }: PlotlyFigure): PlotlyFigure {
	const axis = (a: Record<string, any> = {}) => ({ ...a, tickfont: { ...a.tickfont, family: font, color: muted, size: 13 } });
	return {
		data: data.map((trace: Record<string, any>) =>
			trace.hoverlabel
				? { ...trace, hoverlabel: { ...trace.hoverlabel, font: { ...trace.hoverlabel.font, family: font, color: ink } } }
				: trace
		),
		layout: {
			...layout,
			title: { text: '' },
			font: { ...layout.font, family: font, color: ink },
			xaxis: axis(layout.xaxis),
			yaxis: axis(layout.yaxis),
		},
	};
}

// Same look as the site's figure headings (Figure.astro h3 at full width): Host Grotesk, 30.4px, weight 500
const headingInk = '#0f1219';

function withSiteFont({ data, layout }: PlotlyFigure): PlotlyFigure {
	const title = layout.title ?? {};
	return {
		data,
		layout: {
			...layout,
			font: { ...layout.font, family: font },
			title: {
				...title,
				// <b> tags would override the heading weight
				text: typeof title.text === 'string' ? title.text.replace(/<\/?b>/g, '') : title.text,
				font: { ...title.font, family: font, size: 30.4, weight: 500, color: headingInk },
			},
		},
	};
}

/* Inline dropdown in the title ("…For the [Senate ▾] Midterms").
   The notebook leaves a run of spaces in the title and parks the dropdown at a fixed fraction of the width,
   which only lines up at the notebook's size and font. Here the title is split at the gap: the first part
   stays the title, the dropdown is moved to just after it, and the rest becomes an annotation after the
   dropdown, re-measured whenever the chart resizes. */
type InlineMenu = { annotation: number; fontSize: number; outline: number };

function splitTitleForMenu({ data, layout }: PlotlyFigure): { figure: PlotlyFigure; menu?: InlineMenu } {
	const text = layout.title?.text;
	const gap = typeof text === 'string' && layout.updatemenus?.length ? text.match(/^(.*?\S)\s{3,}(\S.*)$/) : null;
	if (!gap) return { figure: { data, layout } };

	const font = layout.title.font ?? {};
	const annotations = layout.annotations ?? [];
	const [menu, ...otherMenus] = layout.updatemenus;
	// The notebook draws the dropdown's outline as a separate rectangle at the dropdown's old spot; it moves with it
	const outline = (layout.shapes ?? []).findIndex(
		(s: Record<string, any>) => s.type === 'rect' && s.xref === 'paper' && s.yref === 'paper' && Math.abs(s.x0 - menu.x) < 0.05 && s.y0 > 1
	);
	return {
		figure: {
			data,
			layout: {
				...layout,
				// Plotly would otherwise widen the margin whenever the dropdown pokes past the edge, moving everything mid-measurement
				margin: { ...layout.margin, autoexpand: false },
				// Same left edge as the subtitle annotation (x: 0 on the plot area)
				title: { ...layout.title, text: gap[1], xref: 'paper', x: 0, xanchor: 'left' },
				// Dropdown label in the same type as the title around it
				updatemenus: [{ ...menu, font: { ...menu.font, ...font } }, ...otherMenus],
				// Rest of the title, positioned once the first part has been measured
				annotations: [
					...annotations,
					{ text: gap[2], font, showarrow: false, xref: 'paper', yref: 'paper', xanchor: 'left', yanchor: 'middle', x: 0, y: 1, visible: false },
				],
			},
		},
		menu: { annotation: annotations.length, fontSize: font.size ?? 16, outline },
	};
}

async function placeInlineMenu(gd: any, Plotly: any, menu: InlineMenu) {
	await document.fonts.ready; // measure in the real font, not the fallback
	const svg = gd.querySelector('.main-svg');
	if (!svg) return;

	const n = menu.annotation;
	const plot = () => gd._fullLayout._size; // plot area in px
	const toX = (px: number) => (px - plot().l) / plot().w;
	const toY = (py: number) => 1 - (py - plot().t) / plot().h;
	// Position of an element in px from the chart's top-left corner
	const box = (selector: string) => {
		const el = gd.querySelector(selector);
		if (!el) return null;
		const b = el.getBoundingClientRect();
		const o = svg.getBoundingClientRect();
		return { left: b.left - o.left, right: b.right - o.left, top: b.top - o.top, bottom: b.bottom - o.top, mid: (b.top + b.bottom) / 2 - o.top };
	};

	// Edges of the glyphs themselves (an SVG text box includes the font's full ascent and descent, so it isn't
	// centred on the letters); measured with a canvas in the element's own font, from its baseline
	const measure = document.createElement('canvas').getContext('2d')!;
	const ink = (selector: string) => {
		const el = gd.querySelector(selector);
		const em = box(selector);
		if (!el || !em) return null;
		const cs = getComputedStyle(el);
		measure.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
		const m = measure.measureText(el.textContent ?? '');
		const baseline = em.top + m.fontBoundingBoxAscent;
		return {
			left: em.left + m.actualBoundingBoxLeft * -1,
			right: em.left + m.actualBoundingBoxRight,
			top: baseline - m.actualBoundingBoxAscent,
			bottom: baseline + m.actualBoundingBoxDescent,
		};
	};

	// Lay the line out at one font size; returns where it ends
	const layoutLine = async (size: number) => {
		const space = 0.3 * size;
		await Plotly.relayout(gd, { 'title.font.size': size, 'updatemenus[0].font.size': size, [`annotations[${n}].font.size`]: size });
		const title = box('.g-gtitle .gtitle');
		if (!title) return null;

		// Dropdown just after the first part, its label on the same line as the title text
		await Plotly.relayout(gd, { 'updatemenus[0].x': toX(title.right + space), 'updatemenus[0].xanchor': 'left', 'updatemenus[0].y': toY(title.mid), 'updatemenus[0].yanchor': 'middle' });
		const label = box('.updatemenu-header-group .updatemenu-item-text');
		if (label) await Plotly.relayout(gd, { 'updatemenus[0].y': toY(2 * title.mid - label.mid) });

		// Outline drawn around the ink of the label and arrow, with the same padding on every side
		const header = box('.updatemenu-header-group');
		const labelInk = ink('.updatemenu-header-group .updatemenu-item-text');
		const arrowInk = ink('.updatemenu-header-group .updatemenu-header-arrow');
		if (!header || !labelInk || !arrowInk) return null;
		const inkTop = Math.min(labelInk.top, arrowInk.top);
		const inkBottom = Math.max(labelInk.bottom, arrowInk.bottom);
		const pad = (header.bottom - header.top - (inkBottom - inkTop)) / 2;
		const outline = { left: labelInk.left - pad, right: arrowInk.right + pad, top: inkTop - pad, bottom: inkBottom + pad };
		// The open list's rows (and their highlight) span the same width as the outline (see .inline-menu in global.css)
		gd.style.setProperty('--inline-menu-x', `${outline.left - header.left}px`);
		gd.style.setProperty('--inline-menu-width', `${outline.right - outline.left}px`);

		// Rest of the title just after the outline, on the same line
		await Plotly.relayout(gd, {
			[`annotations[${n}].x`]: toX(outline.right + space),
			[`annotations[${n}].y`]: toY(title.mid),
			[`annotations[${n}].visible`]: true,
			...(menu.outline >= 0 && {
				[`shapes[${menu.outline}].x0`]: toX(outline.left),
				[`shapes[${menu.outline}].x1`]: toX(outline.right),
				[`shapes[${menu.outline}].y0`]: toY(outline.bottom),
				[`shapes[${menu.outline}].y1`]: toY(outline.top),
			}),
		});
		const after = box(`.annotation[data-index="${n}"] .annotation-text`);
		if (after && Math.abs(after.mid - title.mid) > 0.5) await Plotly.relayout(gd, { [`annotations[${n}].y`]: toY(2 * title.mid - after.mid) });
		return { left: title.left, right: after?.right ?? outline.right };
	};

	// Full size if it fits, otherwise shrink the whole line to the chart's width
	const available = plot().l + plot().w; // right edge of the plot area
	let fontSize = menu.fontSize;
	for (let i = 0; i < 5; i++) {
		const line = await layoutLine(fontSize);
		if (!line || line.right <= available) return;
		fontSize = Math.floor(fontSize * ((available - line.left) / (line.right - line.left)) * 0.98 * 10) / 10;
	}
}

// Map traces aren't in Plotly's basic build (bar, scatter, pie); the geo build has them but no bar charts,
// so each figure loads whichever build can draw it.
const mapTraces = new Set(['choropleth', 'scattergeo']);
const loadPlotly = (figure: PlotlyFigure) =>
	figure.data.some((trace: Record<string, any>) => mapTraces.has(trace.type))
		? import('plotly.js-geo-dist-min')
		: import('plotly.js-basic-dist-min');

/** Renders a Plotly figure as it was designed in the notebook.
    Plotly is only downloaded once a chart is about to appear, and only once per page. */
export default function PlotlyChart({ figure, label, height, margin, matchSite = false, siteFont = false }: Props) {
	const ref = useRef<HTMLDivElement>(null);
	const chartHeight = height ?? figure.layout.height ?? 500;

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		let Plotly: { newPlot: Function; purge: Function } | undefined;
		let cancelled = false;
		let resizeObserver: ResizeObserver | undefined;

		loadPlotly(figure).then((module) => {
			if (cancelled) return;
			Plotly = module.default;
			const styled = matchSite ? siteStyled(figure) : siteFont ? withSiteFont(figure) : figure;
			const { figure: split, menu } = matchSite ? { figure: styled, menu: undefined } : splitTitleForMenu(styled);
			const { data, layout } = split;
			// Drop any fixed size saved by the notebook, so the chart fills the column and the box below
			const { width: _width, height: _height, ...sized } = layout;
			const finalLayout = margin ? { ...sized, margin: { ...sized.margin, ...margin } } : sized;
			// Same config as the notebook's write_html output
			Plotly!.newPlot(el, data, finalLayout, { responsive: true, displayModeBar: false }).then((gd: any) => {
				if (!menu || cancelled) return;
				// One placement at a time, so a slower earlier one can't overwrite a newer one
				let queue = Promise.resolve();
				const place = () => (queue = queue.then(() => placeInlineMenu(gd, Plotly, menu)).catch(() => {}));
				place();
				// Re-measure when the column width changes, once Plotly's own resize (debounced 100ms) has redrawn
				let timer: ReturnType<typeof setTimeout>;
				let width = el.clientWidth;
				resizeObserver = new ResizeObserver(() => {
					if (el.clientWidth === width) return;
					width = el.clientWidth;
					clearTimeout(timer);
					timer = setTimeout(place, 250);
				});
				resizeObserver.observe(el);

				// Plotly's hover highlight is the size of its own button, not the outline (hidden via .inline-menu in
				// global.css); fill the outline instead, in the same colour Plotly uses
				if (menu.outline >= 0) {
					el.classList.add('inline-menu');
					const highlight = (on: boolean) => {
						const path = el.querySelector<SVGPathElement>(`.shapelayer path[data-index="${menu.outline}"]`);
						if (!path) return;
						// Plotly sets the outline's own fill inline; keep it to put back afterwards
						if (on && !path.dataset.fill) path.dataset.fill = path.style.fill;
						path.style.fill = on ? '#f4faff' : (path.dataset.fill ?? '');
					};
					const inHeader = (node: EventTarget | null) => node instanceof Element && !!node.closest('.updatemenu-header');
					el.addEventListener('pointerover', (e) => inHeader(e.target) && highlight(true));
					el.addEventListener('pointerout', (e) => inHeader(e.target) && !inHeader(e.relatedTarget) && highlight(false));
				}
			});
		});

		return () => {
			cancelled = true;
			resizeObserver?.disconnect();
			Plotly?.purge(el);
		};
	}, []);

	return <div ref={ref} role="img" aria-label={label} style={{ width: '100%', height: `${chartHeight}px` }} />;
}
