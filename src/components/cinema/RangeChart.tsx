import type { PriceRange } from '../../data/cinema/charts';
import { ink, money, muted, rule, useEChart } from './echarts';
import './charts.css';

type Props = {
	title: string;
	items: PriceRange[];
	color: string;
	/** Tooltip wording for each end of the range */
	minLabel: string;
	maxLabel: string;
};

/** Floating bars from each chain's lowest to highest price. */
export default function RangeChart({ title, items, color, minLabel, maxLabel }: Props) {
	// ECharts draws categories bottom-up, so reverse to keep the first chain on top.
	const rows = [...items].reverse();

	const ref = useEChart({
		grid: { top: 8, right: 104, bottom: 4, left: 4, containLabel: true },
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' },
			formatter: (params: { dataIndex: number }[]) => {
				const row = rows[params[0].dataIndex];
				const line = (label: string, value: number, note?: string) =>
					`${label}: <strong>${money(value)}</strong>${note ? ` · ${note}` : ''}`;
				return `<strong>${row.name}</strong><br/>${line(minLabel, row.min, row.minNote)}<br/>${line(maxLabel, row.max, row.maxNote)}`;
			},
		},
		xAxis: {
			type: 'value',
			axisLabel: { color: muted, fontSize: 12, formatter: '£{value}' },
			splitLine: { lineStyle: { color: rule } },
		},
		yAxis: {
			type: 'category',
			data: rows.map((r) => r.name),
			axisTick: { show: false },
			axisLine: { lineStyle: { color: ink } },
			axisLabel: { color: ink, fontSize: 13 },
		},
		series: [
			{
				// Invisible base that offsets each bar to its minimum price
				type: 'bar',
				stack: 'range',
				silent: true,
				itemStyle: { color: 'transparent' },
				data: rows.map((r) => r.min),
			},
			{
				type: 'bar',
				stack: 'range',
				barWidth: '46%',
				itemStyle: { color },
				label: {
					show: true,
					position: 'right',
					color: ink,
					fontSize: 12,
					formatter: ({ dataIndex }: { dataIndex: number }) =>
						`${money(rows[dataIndex].min)}–${money(rows[dataIndex].max)}`,
				},
				data: rows.map((r) => +(r.max - r.min).toFixed(2)),
			},
		],
	});

	const summary = items.map((r) => `${r.name} ${money(r.min)} to ${money(r.max)}`).join('; ');

	return (
		<div class="chart-cell">
			<span class="chart-label">{title}</span>
			<div ref={ref} class="chart-canvas" role="img" aria-label={`${title}. ${summary}`} />
		</div>
	);
}
