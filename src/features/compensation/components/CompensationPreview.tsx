import {
	Alert,
	Box,
	Chip,
	CircularProgress,
	FormControl,
	InputLabel,
	LinearProgress,
	MenuItem,
	Select,
	Typography,
} from "@mui/material"
import Plot from "react-plotly.js"
import { buildPlotData } from "../../plot/utils/plotTraces"
import type { DensityResponse } from "../../../types"

// Mesmo fundo claro do plot principal (padrão citometria).
const PLOT_BG = "#e5e5e5"
const PLOT_HEIGHT = 210

interface CompensationPreviewProps {
	channels: string[]
	xAxis: string
	yAxis: string
	onAxisChange: (axis: "x" | "y", channel: string) => void
	data: DensityResponse | undefined
	/** Primeira carga (ainda sem dado pra mostrar). */
	loading: boolean
	/** Refetch em voo — esmaece o plot, não bloqueia a grade. */
	fetching: boolean
	error: string | null
	/** Amostra do workspace usada no preview. */
	fileName?: string
}

/**
 * FE-41 — density compacto da matriz em edição. Visualmente marcado
 * como "prévia — não aplicada": nada aqui persiste nem muda o plot
 * principal. Eixos são os canais da própria matriz.
 */
export default function CompensationPreview({
	channels,
	xAxis,
	yAxis,
	onAxisChange,
	data,
	loading,
	fetching,
	error,
	fileName,
}: CompensationPreviewProps) {
	return (
		<Box
			sx={{
				border: "1px solid",
				borderColor: "divider",
				borderRadius: 1,
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1,
					px: 1.5,
					py: 1,
					flexWrap: "wrap",
				}}
			>
				<Chip
					label="prévia — não aplicada"
					size="small"
					color="warning"
					variant="outlined"
				/>
				<Box sx={{ flex: 1 }} />
				{(["x", "y"] as const).map((axis) => (
					<FormControl key={axis} size="small" sx={{ minWidth: 92 }}>
						<InputLabel>{axis.toUpperCase()}</InputLabel>
						<Select
							label={axis.toUpperCase()}
							value={axis === "x" ? xAxis : yAxis}
							onChange={(e) => onAxisChange(axis, e.target.value)}
						>
							{channels.map((ch) => (
								<MenuItem key={ch} value={ch}>
									{ch}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				))}
			</Box>

			<Box sx={{ position: "relative", height: PLOT_HEIGHT }}>
				{fetching && (
					<LinearProgress
						sx={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							height: 3,
							zIndex: 2,
						}}
					/>
				)}
				{error ? (
					<Alert severity="error" variant="outlined" sx={{ m: 1.5 }}>
						{error}
					</Alert>
				) : data ? (
					<Box
						sx={{
							height: "100%",
							opacity: fetching ? 0.55 : 1,
							transition: "opacity 0.15s",
						}}
					>
						<Plot
							data={buildPlotData("heatmap", data, "light")}
							useResizeHandler
							style={{ width: "100%", height: "100%" }}
							config={{ staticPlot: true, displayModeBar: false }}
							layout={{
								xaxis: {
									title: { text: xAxis, font: { size: 11 } },
									fixedrange: true,
									showline: true,
									mirror: true,
									linewidth: 1,
									gridcolor: "rgba(0,0,0,0.2)",
									linecolor: "rgba(0,0,0,0.5)",
									zerolinecolor: "rgba(0,0,0,0.5)",
									tickfont: { size: 10 },
								},
								yaxis: {
									title: { text: yAxis, font: { size: 11 } },
									fixedrange: true,
									showline: true,
									mirror: true,
									linewidth: 1,
									gridcolor: "rgba(0,0,0,0.2)",
									linecolor: "rgba(0,0,0,0.5)",
									zerolinecolor: "rgba(0,0,0,0.5)",
									tickfont: { size: 10 },
								},
								autosize: true,
								showlegend: false,
								margin: { l: 46, r: 8, t: 8, b: 34 },
								plot_bgcolor: PLOT_BG,
								paper_bgcolor: PLOT_BG,
								font: { color: "rgba(0,0,0,0.78)" },
							}}
						/>
					</Box>
				) : loading ? (
					<Box
						sx={{
							height: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<CircularProgress size={22} />
					</Box>
				) : (
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ display: "block", textAlign: "center", pt: 4 }}
					>
						Sem dados para os eixos selecionados.
					</Typography>
				)}
			</Box>

			{fileName && (
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ display: "block", px: 1.5, pb: 0.75 }}
				>
					amostra: {fileName}
				</Typography>
			)}
		</Box>
	)
}
