import curzon from './curzon.json';
import everyman from './everyman.json';
import odeonLuxe from './odeon_luxe.json';
import picturehouse from './picturehouse.json';
import { chainColors } from './charts';

// Public Mapbox token (pk.*). Restrict it to your site's URLs in the Mapbox account settings.
export const MAPBOX_TOKEN =
	'pk.eyJ1IjoicGppZTE5OTIiLCJhIjoiY21qNXZxc29hMTJxNDNnczhzZmE3cXJrNSJ9.LJ97byi_nyoS-LMS1L4dtw';

// Custom monochrome "Light 2D" style; the map switches its lighting to day on load.
export const MAPBOX_STYLE = 'mapbox://styles/pjie1992/cmj5yosh3000i01s623143yet';

export type CinemaLayer = {
	id: string;
	name: string;
	color: string;
	data: GeoJSON.FeatureCollection<GeoJSON.Point, { name: string; opened: number }>;
};

export const cinemaLayers = [
	{ id: 'everyman', name: 'Everyman', color: chainColors.Everyman, data: everyman },
	{ id: 'picturehouse', name: 'Picturehouse', color: chainColors.Picturehouse, data: picturehouse },
	{ id: 'curzon', name: 'Curzon', color: chainColors.Curzon, data: curzon },
	{ id: 'odeon-luxe', name: 'Odeon Luxe', color: chainColors['Odeon Luxe'], data: odeonLuxe },
] as CinemaLayer[];

export const yearRange = { min: 2000, max: 2025 };
