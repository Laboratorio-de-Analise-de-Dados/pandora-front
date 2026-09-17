/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL?: string
	/** Tag da release (ex.: v1.2.0) injetada pelo docker build da pipeline. */
	readonly VITE_APP_VERSION?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
