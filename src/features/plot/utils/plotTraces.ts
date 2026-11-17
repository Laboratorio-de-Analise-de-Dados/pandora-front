import type { DensityResponse } from "../../../types"
import type { PlotMode } from "../hooks/usePlotState"
import { DENSITY_STOPS } from "../../../utils/densityRamp"
import { edgesToCenters } from "./geometry"

// Dot plot sempre em SVG (scatter). scattergl/WebGL foi removido por falhar em
// produção em alguns navegadores; a amostra é limitada (5000 pts), então o SVG
// dá conta sem o erro "WebGL is not supported".
const SCATTER_TRACE_TYPE: "scattergl" | "scatter" = "scatter"

// Rampas de densidade por modo do tema (FE-26) — compartilhadas com o
// preview dos cards (`src/utils/densityRamp.ts`). Jet adaptado: o
// clássico azul→vermelho da citometria com primeiro stop escuro para
// não perder as baixas densidades no fundo preto.

// Marcador do scatter: neon no escuro, emerald escuro no claro.
export const SCATTER_COLOR: Record<"light" | "dark", string> = {
	dark: "rgba(52, 211, 153, 0.7)",
	light: "rgba(5, 150, 105, 0.7)",
}

/** Monta os traces do Plotly conforme o modo do gráfico. */
export const buildPlotData = (
	plotMode: PlotMode,
	data?: DensityResponse,
	mode: "light" | "dark" = "dark",
	pointColors?: string[],
): Plotly.Data[] => {
	if (plotMode === "heatmap") {
		return [
			{
				type: "heatmap" as const,
				z: data?.histogram ?? [],
				x: edgesToCenters(data?.x_edges),
				y: edgesToCenters(data?.y_edges),
				colorscale: DENSITY_STOPS[mode],
				showscale: true,
				// FE-50: o z é a contagem de eventos por bin do histograma 2D —
				// sem o título a barra exibia "0-16" sem unidade.
				colorbar: { title: { text: "eventos/bin" } },
				showlegend: false,
			},
		]
	}
	if (plotMode === "contour") {
		// FE-50: isolinhas sobre o mesmo `data.histogram` do heatmap —
		// sem endpoint novo. Níveis automáticos do Plotly + mesma rampa.
		return [
			{
				type: "contour" as const,
				z: data?.histogram ?? [],
				x: edgesToCenters(data?.x_edges),
				y: edgesToCenters(data?.y_edges),
				colorscale: DENSITY_STOPS[mode],
				contours: { coloring: "lines" as const },
				line: { width: 1.5 },
				showscale: false,
				showlegend: false,
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
				showlegend: false,
			},
		]
	}
	return [
		{
			type: SCATTER_TRACE_TYPE,
			mode: "markers" as const,
			x: data?.x ?? [],
			y: data?.y ?? [],
			marker: { color: pointColors ?? SCATTER_COLOR[mode], size: 2 },
			showlegend: false,
		},
	]
}

/** Indica se há dados para o modo atual. */
export const hasPlotData = (
	plotMode: PlotMode,
	data?: DensityResponse,
): boolean => {
	if (plotMode === "heatmap" || plotMode === "contour")
		return !!data?.histogram?.length
	if (plotMode === "histogram") return !!data?.counts?.length
	return !!data?.x?.length
}
