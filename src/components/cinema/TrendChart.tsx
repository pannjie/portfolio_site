import { chainColors, type TrendSeries } from '../../data/cinema/charts';
import { ink, money, muted, rule, useEChart } from './echarts';
import './charts.css';

type Props = {
	title: string;
	years: string[];
	series: TrendSeries[];
};

/** One line per chain, labelled at its end instead of with a legend. */
export default function TrendChart({ title, years, series }: Props) {
	const ref = useEChart({
		grid: { top: 16, right: 124, bottom: 4, left: 4, containLabel: true },
		tooltip: {
			trigger: 'axis',
			valueFormatter: (v: number | null) => (v == null ? '–' : money(v)),
		},
		xAxis: {
			type: 'category',
			data: years,
			boundaryGap: false,
			axisTick: { show: false },
			axisLine: { lineStyle: { color: ink } },
			axisLabel: { color: muted, fontSize: 12 },
		},
		yAxis: {
			type: 'value',
			min: 0,
			axisLabel: { color: muted, fontSize: 12, formatter: '£{value}' },
			splitLine: { lineStyle: { color: rule } },
		},
		series: series.map(({ name, values }) => ({
			name,
			type: 'line',
			data: values,
			color: chainColors[name],
			lineStyle: { width: 2.5 },
			symbolSize: 6,
			endLabel: {
				show: true,
				color: chainColors[name],
				fontSize: 13,
				fontWeight: 500,
				formatter: ({ seriesName, value }: { seriesName: string; value: number }) => `${seriesName} ${money(value)}`,
			},
		})),
	});

	const summary = series
		.map(({ name, values }) => {
			const known = values.filter((v): v is number => v != null);
			return `${name} ${money(known[0])} to ${money(known[known.length - 1])}`;
		})
		.join('; ');

	return (
		<div class="chart-cell">
			<span class="chart-label">{title}</span>
			<div ref={ref} class="chart-canvas" role="img" aria-label={`${title}, ${years[0]}–${years[years.length - 1]}. ${summary}`} />
		</div>
	);
}
