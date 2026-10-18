// Data for "Cinema Enters Its Luxury Era".
// Sources: Companies House filings, Mintel, cinema websites (prices collected Dec 2025 – Jan 2026).

export const chainColors = {
	Everyman: '#e0479e',
	Picturehouse: '#c99700',
	Curzon: '#8a4fd8',
	Odeon: '#0a8fc4',
	'Odeon Luxe': '#0a8fc4',
	Vue: '#00a383',
} as const;

export type GrowthSeries = {
	name: string;
	segment: 'premium' | 'mainstream';
	years: string[];
	/** Year-on-year revenue growth, % */
	values: number[];
};

const growthYears = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];

export const revenueGrowth: GrowthSeries[] = [
	{ name: 'Everyman', segment: 'premium', years: growthYears, values: [37, 28, 25, -62, 102, 60, 15, 17] },
	{ name: 'Picturehouse', segment: 'premium', years: growthYears, values: [28, -1, 5, -71, 31, 118, 21, 22] },
	{ name: 'Curzon', segment: 'premium', years: growthYears, values: [20, 27, 17, -39, 33, 41, 24, 8] },
	{ name: 'Vue', segment: 'mainstream', years: growthYears, values: [0.5, 10, 2, -64, 19, 88, 5, 4] },
	{ name: 'Odeon', segment: 'mainstream', years: growthYears, values: [7, -2, 7, -73, 107, 48, 4, 0.4] },
];

export type PriceRange = {
	name: string;
	min: number;
	max: number;
	/** Extra detail for the tooltip, e.g. venue or menu item */
	minNote?: string;
	maxNote?: string;
};

// Ticket prices for Avatar: Fire and Ash at one London venue per chain
export const ticketPriceRanges: PriceRange[] = [
	{ name: 'Everyman', min: 16.9, max: 21.4, minNote: 'Hampstead', maxNote: 'Hampstead' },
	{ name: 'Curzon', min: 11.95, max: 18.95, minNote: 'Camden', maxNote: 'Camden' },
	{ name: 'Picturehouse', min: 12.15, max: 17.65, minNote: 'Crouch End', maxNote: 'Crouch End' },
	{ name: 'Odeon Luxe', min: 11.5, max: 15.5, minNote: 'Holloway', maxNote: 'Holloway' },
	{ name: 'Odeon', min: 8.75, max: 12.75, minNote: 'Camden', maxNote: 'Camden' },
	{ name: 'Vue', min: 7.49, max: 12.99, minNote: 'Finchley', maxNote: 'Finchley' },
];

// Cheapest and costliest item on each chain's food and drink menu
export const menuPriceRanges: PriceRange[] = [
	{ name: 'Everyman', min: 3.6, max: 47.25, minNote: 'Fresh Mint Tea', maxNote: 'Whispering Angel Côtes de Provence' },
	{ name: 'Curzon', min: 1.75, max: 69, minNote: 'Double Espresso', maxNote: 'Moët & Chandon Brut' },
	{ name: 'Picturehouse', min: 1.25, max: 33, minNote: 'Orange Squash', maxNote: 'Primitivo Lucale Appassimento' },
	{ name: 'Odeon Luxe', min: 4, max: 9.99, minNote: 'Fruit Shoot Orange', maxNote: 'Loaded Pork Hot Dog' },
	{ name: 'Odeon', min: 3.25, max: 9.99, minNote: 'Fruit Shoot Orange', maxNote: 'Loaded Pork Hot Dog' },
	{ name: 'Vue', min: 1.5, max: 5.65, minNote: 'Espresso', maxNote: 'Large Hot Dog' },
];

export type TrendSeries = { name: keyof typeof chainColors; values: (number | null)[] };

const spendYears = ['2018', '2019', '2020', '2021', '2022', '2023', '2024'];

export const concessionSpend = {
	years: spendYears,
	series: [
		{ name: 'Everyman', values: [6.3, 7.13, 7.89, 8.96, 9.34, 10.29, 10.64] },
		{ name: 'Odeon', values: [null, 3.06, 3.34, 3.94, 3.46, 4.11, 4.18] },
		{ name: 'Vue', values: [2.38, 2.43, 2.37, 3.11, 2.97, 3.27, 3.32] },
	] satisfies TrendSeries[],
};

export const ticketSpend = {
	years: spendYears,
	series: [
		{ name: 'Everyman', values: [11.26, 11.37, 11.9, 11.44, 11.29, 11.65, 11.98] },
		{ name: 'Odeon', values: [null, 7.15, 7.63, 8.03, 7.95, 7.89, 7.73] },
		{ name: 'Vue', values: [5.87, 5.32, 5.14, 5.12, 5.12, 5.79, 5.72] },
	] satisfies TrendSeries[],
};
