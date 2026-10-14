/**
 * Feature flags de sugestão de populações (FE-42/FE-45).
 *
 * As entradas do "Sugerir" chamam `POST /analytics/analysis-jobs`,
 * que depende da fila BE-27 no backend — enquanto ela não está em
 * produção, `VITE_SUGGEST=false` esconde o botão da toolbar, os itens
 * "Sugerir populações" da árvore e desliga a query de runs.
 * `VITE_SUGGEST_HISTOGRAM=false` desliga só o caminho 1D (FE-45).
 */
export const SUGGEST_ENABLED = import.meta.env.VITE_SUGGEST !== "false"
export const SUGGEST_HISTOGRAM_ENABLED =
	SUGGEST_ENABLED && import.meta.env.VITE_SUGGEST_HISTOGRAM !== "false"
