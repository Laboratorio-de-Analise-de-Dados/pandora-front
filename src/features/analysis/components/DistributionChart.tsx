import Plot from "react-plotly.js"
import { useTheme } from "@mui/material/styles"
import { Box, CircularProgress, Typography } from "@mui/material"
import type { AnalysisFigure } from "../../../services/figureService"
import type { ExperimentFiles } from "../../../types"
import { useDistributionData } from "../hooks/useDistributionData"
import { channelLabel } from "../utils/figureSeries"

interface DistributionChartProps {
	figure: AnalysisFigure
	files: ExperimentFiles[]
	/** Nomes de exibição dos canais — `spec.channel` é a chave normalizada. */
	channels: string[]
	onInit?: (graphDiv: HTMLElement) => void
}

/**
 * Histogramas 1D sobrepostos (normalizados) — uma curva por
 * grupo × amostra × população. Respeita a compensação aplicada a cada
 * amostra porque usa o mesmo endpoint de densidade do plot.
 */
const DistributionChart = ({
	figure,
	files,
	channels,
	onInit,
}: DistributionChartProps) => {
	const theme = useTheme()
	const { data: series, isLoading } = useDistributionData(figure, files)

	if (!figure.spec.channel) {
		return (
			<Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
				Escolha um canal para ver distribuições.
			</Typography>
		)
	}
	if (isLoading) {
		return (
			<Box sx={{ display: "grid", placeItems: "center", p: 4 }}>
				<CircularProgress size={28} />
			</Box>
		)
	}
	if (!series?.length) {
		return (
			<Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
				Sem dados — verifique grupos e populações.
			</Typography>
		)
	}

	const data: Plotly.Data[] = series.map((s) => ({
		type: "scatter",
		mode: "lines",
		name: s.label,
		x: s.x,
		y: s.y,
		fill: "tozeroy",
		opacity: 0.85,
		line: { width: 1.5 },
	}))

	return (
		<Box sx={{ width: "100%", height: "100%" }}>
			<Plot
				data={data}
				layout={{
					autosize: true,
					paper_bgcolor: "transparent",
					plot_bgcolor: "transparent",
					font: { color: theme.palette.text.secondary },
					margin: { t: 30, r: 16, b: 60, l: 60 },
					xaxis: {
						title: { text: channelLabel(figure.spec.channel, channels) },
					},
					yaxis: { title: { text: "Densidade (normalizada)" } },
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

export default DistributionChart
