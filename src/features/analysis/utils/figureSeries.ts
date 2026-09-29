import type { AnalysisResultData } from "../../../types"
import type {
	FigureMetric,
	FigureResultRow,
} from "../../../services/figureService"

/** Caminho-sentinela da população "amostra inteira" (stats de raiz). */
export const ROOT_POPULATION = "."

export const FIGURE_METRICS: { value: FigureMetric; label: string }[] = [
	{ value: "percent_parent", label: "% do pai" },
	{ value: "percent_total", label: "% do total" },
	{ value: "mean_mfi", label: "MFI média" },
	{ value: "median_mfi", label: "MFI mediana" },
	{ value: "std_dev", label: "Desvio padrão" },
	{ value: "cv", label: "CV" },
]

export const metricLabel = (metric: FigureMetric): string =>
	FIGURE_METRICS.find((m) => m.value === metric)?.label ?? metric

/**
 * Métricas que dependem de `channel_statistics` (exigem `channel` no spec).
 * As percentuais saem de `summary_metrics` e não têm canal.
 */
export const metricNeedsChannel = (metric: FigureMetric): boolean =>
	metric !== "percent_parent" && metric !== "percent_total"

/**
 * Extrai o valor da métrica de um `analysis_result`. Retorna `undefined`
 * quando o resultado não se aplica ou o canal/métrica não existe — ausente
 * é ausente, nunca zero.
 */
export const metricValue = (
	ar: AnalysisResultData | undefined,
	metric: FigureMetric,
	channel?: string,
): number | undefined => {
	if (!ar || ar.applicable === false) return undefined
	if (metric === "percent_parent") {
		return ar.summary_metrics
			? ar.summary_metrics.percent_of_parent_population * 100
			: undefined
	}
	if (metric === "percent_total") {
		return ar.summary_metrics
			? ar.summary_metrics.percent_of_total_population * 100
			: undefined
	}
	if (!channel) return undefined
	return ar.channel_statistics?.[channel]?.[metric]
}

/** Último segmento do caminho ("Linf/CD3/CD4" → "CD4"); "." → "Amostra inteira". */
export const populationLabel = (path: string): string =>
	path === ROOT_POPULATION ? "Amostra inteira" : (path.split("/").pop() ?? path)

export interface StatsTrace {
	type: "bar" | "scatter"
	name: string
	x: string[]
	y: number[]
	text?: string[]
	mode?: "markers"
	marker?: { size: number }
	hovertemplate?: string
}

/**
 * `rows → traces` para os tipos de stats:
 * - `stats_bar`: uma barra por população, altura = média das amostras do grupo
 * - `stats_strip`: pontos por população — um marcador por amostra do grupo
 * Ausentes não geram ponto (linhas que não existem em `rows`).
 */
export const buildStatsTraces = (
	rows: FigureResultRow[],
	populations: string[],
	groupNames: string[],
	chartType: "stats_bar" | "stats_strip",
): StatsTrace[] =>
	populations.map((pop) => {
		if (chartType === "stats_bar") {
			const y = groupNames.map((group) => {
				const values = rows
					.filter((r) => r.group === group && r.population === pop)
					.map((r) => r.value)
				return values.length
					? values.reduce((acc, v) => acc + v, 0) / values.length
					: NaN
			})
			const text = groupNames.map((group) => {
				const n = rows.filter(
					(r) => r.group === group && r.population === pop,
				).length
				return `n=${n}`
			})
			return {
				type: "bar",
				name: populationLabel(pop),
				x: groupNames,
				y,
				text,
				hovertemplate:
					"%{x}<br>%{y:.2f}<br>%{text}<extra>%{fullData.name}</extra>",
			}
		}
		const popRows = rows.filter((r) => r.population === pop)
		return {
			type: "scatter",
			mode: "markers",
			name: populationLabel(pop),
			x: popRows.map((r) => r.group),
			y: popRows.map((r) => r.value),
			text: popRows.map((r) => r.file_name),
			marker: { size: 9 },
			hovertemplate:
				"%{x}<br>%{y:.2f}<br>%{text}<extra>%{fullData.name}</extra>",
		}
	})

/** Linhas do CSV: cabeçalho de proveniência + dados. */
export const buildFigureCsvRows = (
	figureName: string,
	revision: number | null,
	computedAt: string | undefined,
	metric: FigureMetric,
	rows: FigureResultRow[],
): string[][] => [
	[`figura: ${figureName}`],
	[`revisão de origem: ${revision ?? "—"}`],
	[`computado em: ${computedAt ?? "—"}`],
	[],
	["Grupo", "Amostra", "População", metricLabel(metric)],
	...rows.map((r) => [
		r.group,
		r.file_name,
		populationLabel(r.population),
		r.value.toFixed(4),
	]),
]
