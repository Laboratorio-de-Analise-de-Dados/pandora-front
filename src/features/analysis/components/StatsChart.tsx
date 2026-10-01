import { useMemo } from "react"
import Plot from "react-plotly.js"
import { Box, Typography } from "@mui/material"
import type { AnalysisFigure } from "../../../services/figureService"
import {
	buildStatsTraces,
	channelLabel,
	groupAggregates,
	isPercentMetric,
	metricLabel,
	pToStars,
	populationLabel,
} from "../utils/figureSeries"

/**
 * Área fixa e fundo branco — padrão de publicação (PRD FE-36 §3):
 * diverge intencionalmente do tema dark pra saída previsível no export.
 */
export const ANALYSIS_PLOT_SIZE = { width: 800, height: 480 }
const PLOT_FONT = { color: "#1a1a1a" }

interface StatsChartProps {
	figure: AnalysisFigure
	/** Nomes de exibição dos canais — `spec.channel` é a chave normalizada. */
	channels: string[]
	/** Overlay "Média ± desvio padrão" por grupo (calculado das rows). */
	showMeanSd?: boolean
	/** Brackets de significância entre grupos (`result_cache.stats_tests`). */
	showSignificance?: boolean
	onInit?: (graphDiv: HTMLElement) => void
}

/** Barras agrupadas ou strip plot de `result_cache` (FE-36). */
const StatsChart = ({
	figure,
	channels,
	showMeanSd = false,
	showSignificance = false,
	onInit,
}: StatsChartProps) => {
	const cache = figure.result_cache
	const groupNames = useMemo(
		() => figure.spec.groups.map((g) => g.name),
		[figure.spec.groups],
	)
	const chartType = figure.chart_type as "stats_bar" | "stats_strip"
	const aggregates = useMemo(
		() => groupAggregates(cache?.rows ?? []),
		[cache?.rows],
	)

	const data = useMemo(() => {
		if (!cache) return []
		const traces = buildStatsTraces(
			cache.rows,
			figure.spec.populations,
			groupNames,
			chartType,
			figure.spec.metric,
		) as unknown as Plotly.Data[]
		if (!showMeanSd) return traces
		if (chartType === "stats_bar") {
			// A barra já é a média — o overlay é o whisker de ±1 SD.
			return traces.map((t, i) => {
				const pop = figure.spec.populations[i]
				const sd = groupNames.map(
					(g) =>
						aggregates.find((a) => a.population === pop && a.group === g)?.sd ??
						0,
				)
				return {
					...t,
					error_y: {
						type: "data" as const,
						array: sd,
						visible: true,
						thickness: 1.5,
					},
				}
			})
		}
		// Strip: marcador horizontal na média + whisker de ±1 SD por grupo.
		const overlays = figure.spec.populations.flatMap((pop) => {
			const entries = groupNames
				.map((g) =>
					aggregates.find((a) => a.population === pop && a.group === g),
				)
				.filter((a): a is NonNullable<typeof a> => !!a)
			if (!entries.length) return []
			return [
				{
					type: "scatter",
					mode: "markers",
					name: `${populationLabel(pop)} — média±SD`,
					x: entries.map((a) => a.group),
					y: entries.map((a) => a.mean),
					error_y: {
						type: "data",
						array: entries.map((a) => a.sd),
						visible: true,
						thickness: 1.5,
					},
					marker: { symbol: "line-ns", size: 18, line: { width: 2 } },
					showlegend: false,
					hovertemplate: `média %{y:.4g} ±1SD<extra>${populationLabel(pop)}</extra>`,
				} as unknown as Plotly.Data,
			]
		})
		return [...traces, ...overlays]
	}, [
		cache,
		figure.spec.populations,
		figure.spec.metric,
		groupNames,
		chartType,
		showMeanSd,
		aggregates,
	])

	// Brackets Prism: linha ligando grupo_a→group_b, estrelas do p_adj.
	const { shapes, annotations, yRange } = useMemo(() => {
		const tests = showSignificance ? (cache?.stats_tests ?? []) : []
		if (!tests.length || !cache?.rows.length) {
			return { shapes: [], annotations: [], yRange: undefined }
		}
		const values = cache.rows.map((r) => r.value)
		const max = Math.max(...values)
		const min = Math.min(...values, 0)
		const step = (max - min || Math.abs(max) || 1) * 0.1
		const shapes: Partial<Plotly.Shape>[] = []
		const annotations: Partial<Plotly.Annotations>[] = []
		let level = 0
		for (const t of tests) {
			for (const pair of t.pairwise) {
				const xa = groupNames.indexOf(pair.group_a)
				const xb = groupNames.indexOf(pair.group_b)
				if (xa < 0 || xb < 0) continue
				const y = max + step * (level + 1.4)
				shapes.push({
					type: "path",
					path: `M ${xa + 0.05},${y - step * 0.25} L ${xa + 0.05},${y} L ${xb - 0.05},${y} L ${xb - 0.05},${y - step * 0.25}`,
					line: { color: "#1a1a1a", width: 1.2 },
				})
				annotations.push({
					x: (xa + xb) / 2,
					y: y + step * 0.08,
					text:
						(tests.length > 1 ? `${populationLabel(t.population)} ` : "") +
						pToStars(pair.p_adj),
					showarrow: false,
					font: { size: 12, color: "#1a1a1a" },
				})
				level += 1
			}
		}
		return {
			shapes,
			annotations,
			yRange: level ? [min, max + step * (level + 2.4)] : undefined,
		}
	}, [cache, showSignificance, groupNames])

	if (!cache || cache.rows.length === 0) {
		return (
			<Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
				Sem dados — ajuste os grupos/populações e recompute.
			</Typography>
		)
	}

	return (
		<Box sx={{ overflowX: "auto" }}>
			<Plot
				data={data}
				layout={{
					...ANALYSIS_PLOT_SIZE,
					autosize: false,
					barmode: "group",
					paper_bgcolor: "#ffffff",
					plot_bgcolor: "#ffffff",
					font: PLOT_FONT,
					margin: { t: 30, r: 16, b: 60, l: 60 },
					shapes,
					annotations,
					xaxis: {
						title: { text: "Grupo" },
						type: "category",
						categoryarray: groupNames,
						categoryorder: "array",
					},
					yaxis: {
						title: {
							text: figure.spec.channel
								? `${metricLabel(figure.spec.metric)} — ${channelLabel(figure.spec.channel, channels)}`
								: metricLabel(figure.spec.metric),
						},
						...(yRange ? { range: yRange } : {}),
						// percent_* chegam como fração — eixo em %.
						...(isPercentMetric(figure.spec.metric)
							? { tickformat: ".0%" }
							: {}),
					},
					legend: { orientation: "h", y: -0.2 },
				}}
				config={{ displaylogo: false }}
				onInitialized={(_fig, gd) => onInit?.(gd)}
				onUpdate={(_fig, gd) => onInit?.(gd)}
			/>
		</Box>
	)
}

export default StatsChart
