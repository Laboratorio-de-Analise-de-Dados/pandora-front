import { useMemo } from "react"
import Plot from "react-plotly.js"
import { useTheme } from "@mui/material/styles"
import { Box, Typography } from "@mui/material"
import type { AnalysisFigure } from "../../../services/figureService"
import {
	buildStatsTraces,
	isPercentMetric,
	metricLabel,
} from "../utils/figureSeries"

interface StatsChartProps {
	figure: AnalysisFigure
	onInit?: (graphDiv: HTMLElement) => void
}

/** Barras agrupadas ou strip plot de `result_cache` (FE-36). */
const StatsChart = ({ figure, onInit }: StatsChartProps) => {
	const theme = useTheme()
	const cache = figure.result_cache

	const data = useMemo(() => {
		if (!cache) return []
		const groupNames = figure.spec.groups.map((g) => g.name)
		return buildStatsTraces(
			cache.rows,
			figure.spec.populations,
			groupNames,
			figure.chart_type as "stats_bar" | "stats_strip",
			figure.spec.metric,
		) as unknown as Plotly.Data[]
	}, [cache, figure.spec, figure.chart_type])

	if (!cache || cache.rows.length === 0) {
		return (
			<Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
				Sem dados — ajuste os grupos/populações e recompute.
			</Typography>
		)
	}

	return (
		<Box sx={{ width: "100%", height: "100%" }}>
			<Plot
				data={data}
				layout={{
					autosize: true,
					barmode: "group",
					paper_bgcolor: "transparent",
					plot_bgcolor: "transparent",
					font: { color: theme.palette.text.secondary },
					margin: { t: 30, r: 16, b: 60, l: 60 },
					xaxis: { title: { text: "Grupo" } },
					yaxis: {
						title: {
							text: figure.spec.channel
								? `${metricLabel(figure.spec.metric)} — ${figure.spec.channel}`
								: metricLabel(figure.spec.metric),
						},
						// percent_* chegam como fração — eixo em %.
						...(isPercentMetric(figure.spec.metric)
							? { tickformat: ".0%" }
							: {}),
					},
					legend: { orientation: "h", y: -0.2 },
				}}
				config={{ displaylogo: false, responsive: true }}
				style={{ width: "100%", height: "100%" }}
				onInitialized={(_fig, gd) => onInit?.(gd)}
				onUpdate={(_fig, gd) => onInit?.(gd)}
			/>
		</Box>
	)
}

export default StatsChart
