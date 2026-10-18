import type { GrowthSeries } from '../../data/cinema/charts';
import { ink, muted, rule, useEChart } from './echarts';
import './charts.css';

const segmentColor = { premium: '#3f8f5b', mainstream: '#4a64b5' };
const declineColor = '#d1495b';

/** Year-on-year revenue growth for one chain, as a bar per year. */
export default function GrowthChart({ name, segment, years, values }: GrowthSeries) {
	const ref = useEChart({
		grid: { top: 28, right: 8, bottom: 4, left: 4, containLabel: true },
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' },
			valueFormatter: (v: number) => `${v > 0 ? '+' : ''}${v}%`,
		},
		xAxis: {
			type: 'category',
			data: years.map((y) => `’${y.slice(2)}`),
			axisTick: { show: false },
			axisLine: { lineStyle: { color: ink } },
			axisLabel: { color: muted, fontSize: 12 },
		},
		yAxis: {
			type: 'value',
			min: -80,
			max: 120,
			interval: 40,
			axisLabel: { color: muted, fontSize: 12, formatter: '{value}%' },
			splitLine: { lineStyle: { color: rule } },
		},
		series: [
			{
				type: 'bar',
				name,
				barWidth: '62%',
				data: values.map((value) => ({
					value,
					itemStyle: { color: value < 0 ? declineColor : segmentColor[segment] },
					label: { position: value < 0 ? 'bottom' : 'top' },
				})),
				label: { show: true, color: ink, fontSize: 11, formatter: '{c}' },
			},
		],
	});

	const summary = years.map((y, i) => `${y}: ${values[i]}%`).join(', ');

	return (
		<div class="chart-cell">
			<span class="chart-label">
				{name} <span class="chart-label-note">{segment}</span>
			</span>
			<div ref={ref} class="chart-canvas chart-canvas--small" role="img" aria-label={`${name} annual revenue growth. ${summary}`} />
		</div>
	);
}
