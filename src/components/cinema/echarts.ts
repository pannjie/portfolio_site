import { useEffect, useRef } from 'preact/hooks';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

// Only the pieces these charts use, so the island bundles stay small.
echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

export type ChartOption = echarts.EChartsCoreOption;

// Site palette (matches --gray-dark / --gray-light in global.css)
export const ink = '#222939';
export const muted = '#60739f';
export const rule = '#e5e9f0';
export const font = "'Host Grotesk', 'Atkinson', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const baseOption: ChartOption = {
	textStyle: { fontFamily: font, color: ink },
	animationDuration: 600,
	tooltip: {
		confine: true,
		backgroundColor: '#fff',
		borderColor: ink,
		borderWidth: 1,
		padding: [6, 8],
		textStyle: { fontFamily: font, fontSize: 13, color: ink },
		extraCssText: 'border-radius: 0; box-shadow: none;',
	},
};

/** Mounts an ECharts instance on the returned ref and keeps it sized to its container. */
export function useEChart(option: ChartOption) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const chart = echarts.init(el, undefined, { renderer: 'canvas' });
		chart.setOption({ ...baseOption, ...option });

		const resize = new ResizeObserver(() => chart.resize());
		resize.observe(el);

		return () => {
			resize.disconnect();
			chart.dispose();
		};
	}, []);

	return ref;
}

export const money = (value: number) => `£${value.toFixed(2).replace(/\.00$/, '')}`;
