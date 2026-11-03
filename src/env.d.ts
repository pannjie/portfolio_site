interface ImportMetaEnv {
	/** Mapbox public token for the cinema story map (see .env.example) */
	readonly PUBLIC_MAPBOX_TOKEN?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// The prebuilt Plotly bundle ships without type definitions
declare module 'plotly.js-basic-dist-min';
