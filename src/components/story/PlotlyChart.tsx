import { useEffect, useRef } from 'preact/hooks';

/** A figure exported from Python with fig.write_json(), or lifted out of a fig.write_html() embed. */
export type PlotlyFigure = { data: object[]; layout: Record<string, any> };

interface Props {
	figure: PlotlyFigure;
	/** Accessible description of what the chart shows */
	label: string;
	/** Chart height in px; the width fills the column */
	height?: number;
	/** Overrides the figure's own margins in px, e.g. { l: 10, r: 10 }; sides left out keep the figure's value */
	margin?: { l?: number; r?: number; t?: number; b?: number };
	/** Restyle the figure like the site's ECharts charts: site font and colours, and no Plotly title
	    (put the title and subtitle on the surrounding <Figure> instead) */
	matchSite?: boolean;
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

/** Renders a Plotly figure as it was designed in the notebook.
    Plotly is only downloaded once a chart is about to appear, and only once per page. */
export default function PlotlyChart({ figure, label, height = 500, margin, matchSite = false }: Props) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		let Plotly: { newPlot: Function; purge: Function } | undefined;
		let cancelled = false;

		import('plotly.js-basic-dist-min').then((module) => {
			if (cancelled) return;
			Plotly = module.default;
			const { data, layout } = matchSite ? siteStyled(figure) : figure;
			const finalLayout = margin ? { ...layout, margin: { ...layout.margin, ...margin } } : layout;
			// Same config as the notebook's write_html output
			Plotly!.newPlot(el, data, finalLayout, { responsive: true, displayModeBar: false });
		});

		return () => {
			cancelled = true;
			Plotly?.purge(el);
		};
	}, []);

	return <div ref={ref} role="img" aria-label={label} style={{ width: '100%', height: `${height}px` }} />;
}
