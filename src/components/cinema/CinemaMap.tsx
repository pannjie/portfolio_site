import { useEffect, useRef, useState } from 'preact/hooks';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { CinemaLayer } from '../../data/cinema/map';
import './charts.css';
import './CinemaMap.css';

type Props = {
	title: string;
	token: string;
	styleUrl: string;
	layers: CinemaLayer[];
	minYear: number;
	maxYear: number;
};

/** London premium cinemas, filtered by opening year with a slider. */
export default function CinemaMap({ title, token, styleUrl, layers, minYear, maxYear }: Props) {
	const container = useRef<HTMLDivElement>(null);
	const map = useRef<mapboxgl.Map | null>(null);
	const [year, setYear] = useState(maxYear);

	const countOpen = (y: number) =>
		layers.reduce((n, l) => n + l.data.features.filter((f) => f.properties.opened <= y).length, 0);

	useEffect(() => {
		if (!container.current) return;

		mapboxgl.accessToken = token;
		const instance = new mapboxgl.Map({
			container: container.current,
			style: styleUrl,
			center: [-0.11947, 51.511227],
			zoom: 10,
			cooperativeGestures: true,
		});
		map.current = instance;

		// The custom style uses the night preset; use daylight to match the site.
		instance.on('style.load', () => instance.setConfigProperty('basemap', 'lightPreset', 'day'));

		const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'cinema-popup' });

		instance.on('load', () => {
			for (const layer of layers) {
				instance.addSource(layer.id, { type: 'geojson', data: layer.data });
				instance.addLayer({
					id: layer.id,
					type: 'circle',
					source: layer.id,
					filter: ['<=', ['get', 'opened'], maxYear],
					paint: {
						'circle-radius': 7,
						'circle-color': layer.color,
						'circle-stroke-width': 1.5,
						'circle-stroke-color': '#ffffff',
						'circle-emissive-strength': 1,
					},
				});

				instance.on('mouseenter', layer.id, (e) => {
					const feature = e.features?.[0];
					if (!feature || feature.geometry.type !== 'Point') return;
					instance.getCanvas().style.cursor = 'pointer';
					const { name, opened } = feature.properties as { name: string; opened?: number };
					popup
						.setLngLat(feature.geometry.coordinates as [number, number])
						.setHTML(`<strong>${name}</strong><br/>${layer.name} · opened ${opened ?? 'unknown'}`)
						.addTo(instance);
				});

				instance.on('mouseleave', layer.id, () => {
					instance.getCanvas().style.cursor = '';
					popup.remove();
				});
			}
		});

		return () => instance.remove();
	}, []);

	const onYear = (value: number) => {
		setYear(value);
		const instance = map.current;
		if (!instance?.isStyleLoaded()) return;
		for (const layer of layers) {
			if (instance.getLayer(layer.id)) instance.setFilter(layer.id, ['<=', ['get', 'opened'], value]);
		}
	};

	return (
		<div class="cinema-map">
			<div ref={container} class="cinema-map-canvas" role="region" aria-label={`Map: ${title}`} />

			<div class="cinema-map-panel">
				<span class="chart-label">{title}</span>

				<label class="cinema-map-year">
					<span>Opened by</span>
					<output>{year}</output>
				</label>
				<input
					type="range"
					min={minYear}
					max={maxYear}
					step={1}
					value={year}
					aria-label="Show cinemas opened by year"
					onInput={(e) => onYear(Number((e.target as HTMLInputElement).value))}
				/>
				<p class="cinema-map-count">{countOpen(year)} premium cinemas</p>

				<ul class="cinema-map-legend">
					{layers.map((l) => (
						<li key={l.id}>
							<span class="dot" style={{ background: l.color }} />
							{l.name}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
