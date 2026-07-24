import type { DensityResponse } from "../../../types"
import type { PlotMode } from "../hooks/usePlotState"
import { edgesToCenters } from "./geometry"

// Dot plot sempre em SVG (scatter). scattergl/WebGL foi removido por falhar em
// produção em alguns navegadores; a amostra é limitada (5000 pts), então o SVG
// dá conta sem o erro "WebGL is not supported".
const SCATTER_TRACE_TYPE: "scattergl" | "scatter" = "scatter"

/** Monta os traces do Plotly conforme o modo do gráfico. */
export const buildPlotData = (
	plotMode: PlotMode,
	data?: DensityResponse,
): Plotly.Data[] => {
	if (plotMode === "heatmap") {
		return [
			{
				type: "heatmap" as const,
				z: data?.histogram ?? [],
				x: edgesToCenters(data?.x_edges),
				y: edgesToCenters(data?.y_edges),
				colorscale: "Jet" as const,
				showscale: true,
			},
		]
	}
	if (plotMode === "histogram") {
		return [
			{
				type: "bar" as const,
				x: edgesToCenters(data?.edges),
				y: data?.counts ?? [],
				marker: { color: "#1976d2" },
			},
		]
	}
	return [
		{
			type: SCATTER_TRACE_TYPE,
			mode: "markers" as const,
			x: data?.x ?? [],
			y: data?.y ?? [],
			marker: { color: "black", size: 2 },
		},
	]
}

/** Indica se há dados para o modo atual. */
export const hasPlotData = (
	plotMode: PlotMode,
	data?: DensityResponse,
): boolean => {
	if (plotMode === "heatmap") return !!data?.histogram?.length
	if (plotMode === "histogram") return !!data?.counts?.length
	return !!data?.x?.length
}
