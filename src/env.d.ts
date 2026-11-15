interface ImportMetaEnv {
	/** Mapbox public token for the cinema story map (see .env.example) */
	readonly PUBLIC_MAPBOX_TOKEN?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// The prebuilt Plotly bundles ship without type definitions
declare module 'plotly.js-basic-dist-min';
declare module 'plotly.js-geo-dist-min';
