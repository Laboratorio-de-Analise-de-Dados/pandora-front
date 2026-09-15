import type { DensityResponse } from "../../../types"
import type { PlotMode } from "../hooks/usePlotState"
import { edgesToCenters } from "./geometry"

// Dot plot sempre em SVG (scatter). scattergl/WebGL foi removido por falhar em
// produção em alguns navegadores; a amostra é limitada (5000 pts), então o SVG
// dá conta sem o erro "WebGL is not supported".
const SCATTER_TRACE_TYPE: "scattergl" | "scatter" = "scatter"

// Rampas de densidade por modo do tema (FE-26). Dark: base quase preta
// soma no canvas e os aglomerados "acendem" em emerald → neon (`Jet` foi
// feito para fundo claro e perdia as baixas densidades no preto).
// Light: o inverso — base clara some no papel e a densidade escurece.
const DENSITY_COLORSCALE: Record<"light" | "dark", [number, string][]> = {
	dark: [
		[0, "#0B1F17"],
		[0.18, "#064E3B"],
		[0.4, "#047857"],
		[0.62, "#10B981"],
		[0.8, "#34D399"],
		[1, "#D1FAE5"],
	],
	light: [
		[0, "#F4F4F4"],
		[0.18, "#D1FAE5"],
		[0.4, "#6EE7B7"],
		[0.62, "#10B981"],
		[0.8, "#047857"],
		[1, "#064E3B"],
	],
}

// Marcador do scatter: neon no escuro, emerald escuro no claro.
const SCATTER_COLOR: Record<"light" | "dark", string> = {
	dark: "rgba(52, 211, 153, 0.7)",
	light: "rgba(5, 150, 105, 0.7)",
}

/** Monta os traces do Plotly conforme o modo do gráfico. */
export const buildPlotData = (
	plotMode: PlotMode,
	data?: DensityResponse,
	mode: "light" | "dark" = "dark",
): Plotly.Data[] => {
	if (plotMode === "heatmap") {
		return [
			{
				type: "heatmap" as const,
				z: data?.histogram ?? [],
				x: edgesToCenters(data?.x_edges),
				y: edgesToCenters(data?.y_edges),
				colorscale: DENSITY_COLORSCALE[mode],
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
				marker: { color: "#10B981" },
			},
		]
	}
	return [
		{
			type: SCATTER_TRACE_TYPE,
			mode: "markers" as const,
			x: data?.x ?? [],
			y: data?.y ?? [],
			marker: { color: SCATTER_COLOR[mode], size: 2 },
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
