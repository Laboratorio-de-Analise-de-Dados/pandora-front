/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL?: string
	/** Tag da release (ex.: v1.2.0) injetada pelo docker build da pipeline. */
	readonly VITE_APP_VERSION?: string
	/** "false" esconde o "Sugerir" inteiro (FE-42/FE-45) — default ligado. */
	readonly VITE_SUGGEST?: string
	/** "false" desliga o "Sugerir" no modo histograma (FE-45). */
	readonly VITE_SUGGEST_HISTOGRAM?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
