import type { AnalysisResultData } from "../../../types"
import type {
	FigureMetric,
	FigureResultRow,
	FigureStatsTestResult,
} from "../../../services/figureService"

/** Literal do contrato BE-33 para a população "amostra inteira" (stats de raiz). */
export const ROOT_POPULATION = "file"

export const FIGURE_METRICS: { value: FigureMetric; label: string }[] = [
	{ value: "percent_parent", label: "% do pai" },
	{ value: "percent_total", label: "% do total" },
	{ value: "mean_mfi", label: "MFI média" },
	{ value: "median_mfi", label: "MFI mediana" },
	{ value: "std_dev", label: "Desvio padrão" },
	{ value: "cv", label: "CV" },
	{ value: "rcv", label: "rCV" },
]

export const metricLabel = (metric: FigureMetric): string =>
	FIGURE_METRICS.find((m) => m.value === metric)?.label ?? metric

/**
 * Chave do canal como o backend persiste (`normalize_column_name`:
 * lowercase, sem espaços, "-"→"_") — é assim que `channel_statistics` é
 * indexada e o que `spec.channel` deve carregar. Idempotente.
 */
export const normalizeChannelKey = (name: string): string =>
	name.toLowerCase().replace(/ /g, "").replace(/-/g, "_")

/** Nome de exibição ("PE-A") a partir da chave normalizada do spec. */
export const channelLabel = (
	channel: string | undefined,
	channels: string[],
): string =>
	channel == null
		? ""
		: (channels.find((c) => normalizeChannelKey(c) === channel) ?? channel)

/**
 * Métricas que dependem de `channel_statistics` (exigem `channel` no spec).
 * As percentuais saem de `summary_metrics` e não têm canal.
 */
export const metricNeedsChannel = (metric: FigureMetric): boolean =>
	metric !== "percent_parent" && metric !== "percent_total"

/**
 * Extrai o valor cru da métrica de um `analysis_result` — percentuais ficam
 * em fração (0.25), como o backend emite nos rows (a conversão para % é só
 * de exibição, ver `formatMetricValue`). Retorna `undefined` quando o
 * resultado não se aplica ou o canal/métrica não existe — ausente é
 * ausente, nunca zero.
 */
export const metricValue = (
	ar: AnalysisResultData | undefined,
	metric: FigureMetric,
	channel?: string,
): number | undefined => {
	if (!ar || ar.applicable === false) return undefined
	if (metric === "percent_parent") {
		return ar.summary_metrics?.percent_of_parent_population
	}
	if (metric === "percent_total") {
		return ar.summary_metrics?.percent_of_total_population
	}
	if (!channel) return undefined
	return ar.channel_statistics?.[normalizeChannelKey(channel)]?.[metric]
}

/** Métrica é percentual (valor cru = fração)? */
export const isPercentMetric = (metric: FigureMetric): boolean =>
	metric === "percent_parent" || metric === "percent_total"

/**
 * Valor para exibição/export: percentuais viram % com 2 casas
 * (0.25 → "25.00"); demais métricas, 4 casas.
 */
export const formatMetricValue = (
	metric: FigureMetric,
	value: number,
): string =>
	isPercentMetric(metric) ? (value * 100).toFixed(2) : value.toFixed(4)

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
	metric: FigureMetric,
): StatsTrace[] => {
	const yFmt = isPercentMetric(metric) ? "%{y:.2%}" : "%{y:.2f}"
	return populations.map((pop) => {
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
				hovertemplate: `%{x}<br>${yFmt}<br>%{text}<extra>%{fullData.name}</extra>`,
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
			hovertemplate: `%{x}<br>${yFmt}<br>%{text}<extra>%{fullData.name}</extra>`,
		}
	})
}

/** Linhas do CSV: cabeçalho de proveniência + dados. */
export const buildFigureCsvRows = (
	figureName: string,
	revision: number | null,
	computedAt: string | undefined,
	metric: FigureMetric,
	rows: FigureResultRow[],
	statsTests?: FigureStatsTestResult[],
): string[][] => {
	const header = [
		[`figura: ${figureName}`],
		[`revisão de origem: ${revision ?? "—"}`],
		[`computado em: ${computedAt ?? "—"}`],
		[],
	]
	const dataRows = [
		["Grupo", "Amostra", "População", metricLabel(metric)],
		...rows.map((r) => [
			r.group,
			r.file_name,
			populationLabel(r.population),
			formatMetricValue(metric, r.value),
		]),
	]
	// Agregados por grupo + stats_tests — pra remontar o gráfico no
	// Prism/Excel/R sem depender das rows cruas (FE-36 §6).
	const aggregates = groupAggregates(rows)
	const aggregateRows = aggregates.length
		? [
				[],
				["Agregados por grupo"],
				["População", "Grupo", "n", "Média", "SD", "Mediana"],
				...aggregates.map((a) => [
					populationLabel(a.population),
					a.group,
					String(a.n),
					formatMetricValue(metric, a.mean),
					formatMetricValue(metric, a.sd),
					formatMetricValue(metric, a.median),
				]),
			]
		: []
	const testRows = (statsTests ?? []).flatMap((t) => {
		const lines: string[][] = [
			[],
			[
				`Testes estatísticos — ${populationLabel(t.population)}: ${statsTestLabel(t)}`,
			],
		]
		if (t.omnibus) {
			lines.push([
				"omnibus",
				t.omnibus.test,
				t.omnibus.F != null ? `F=${t.omnibus.F}` : `H=${t.omnibus.H}`,
				`p=${t.omnibus.p}`,
				`df=${t.omnibus.df.join(",")}`,
			])
		}
		for (const pair of t.pairwise) {
			lines.push([
				"par",
				`${pair.group_a} vs ${pair.group_b}`,
				pair.t != null ? `t=${pair.t}` : `U=${pair.U}`,
				`p=${pair.p}`,
				`p_adj=${pair.p_adj}`,
				pair.method,
			])
		}
		for (const w of t.warnings) lines.push(["aviso", w])
		return lines
	})
	return [...header, ...dataRows, ...aggregateRows, ...testRows]
}

/** Agregados por grupo × população, das `rows` cruas do cache. */
export interface GroupAggregate {
	population: string
	group: string
	n: number
	mean: number
	sd: number
	median: number
}

export const groupAggregates = (rows: FigureResultRow[]): GroupAggregate[] => {
	const key = (r: FigureResultRow) => `${r.population}\u001f${r.group}`
	const buckets = new Map<string, FigureResultRow[]>()
	for (const r of rows) {
		const k = key(r)
		buckets.set(k, [...(buckets.get(k) ?? []), r])
	}
	return [...buckets.values()].map((bucket) => {
		const values = bucket.map((r) => r.value).sort((a, b) => a - b)
		const n = values.length
		const mean = values.reduce((acc, v) => acc + v, 0) / n
		const sd =
			n > 1
				? Math.sqrt(
						values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1),
					)
				: 0
		const median =
			n % 2 ? values[(n - 1) / 2] : (values[n / 2 - 1] + values[n / 2]) / 2
		return {
			population: bucket[0].population,
			group: bucket[0].group,
			n,
			mean,
			sd,
			median,
		}
	})
}

/** p-valor ajustado → notação Prism (ns / * / ** / ***). */
export const pToStars = (p: number): string =>
	p < 0.001 ? "***" : p < 0.01 ? "**" : p < 0.05 ? "*" : "ns"

const OMNIBUS_LABELS: Record<string, string> = {
	one_way_anova: "ANOVA",
	kruskal_wallis: "Kruskal-Wallis",
}
const PAIRWISE_LABELS: Record<string, string> = {
	welch_t: "Welch t",
	t_student: "t de Student",
	mann_whitney_u: "Mann-Whitney",
}

/**
 * Metodologia efetiva do teste, pra exibição (chip) e export —
 * ex.: "ANOVA + Welch t (BH)". Com `stats_test: "auto"` é como o
 * analista descobre qual método o backend escolheu (FE-36 §3).
 */
export const statsTestLabel = (t: FigureStatsTestResult): string => {
	const parts: string[] = []
	if (t.omnibus) parts.push(OMNIBUS_LABELS[t.omnibus.test] ?? t.omnibus.test)
	const pairwiseMethod = t.pairwise[0]?.method
	if (pairwiseMethod)
		parts.push(PAIRWISE_LABELS[pairwiseMethod] ?? pairwiseMethod)
	return parts.length ? `${parts.join(" + ")} (BH)` : t.method
}
