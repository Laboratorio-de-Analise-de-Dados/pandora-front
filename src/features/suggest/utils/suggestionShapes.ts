import type { GateCoordinates, GateSuggestion, Scale } from "../../../types"
import { biex, COFACTOR } from "../../plot/utils/biex"
import { hexToRgba } from "../../../constants/gateColors"

/**
 * FE-42 §4 — candidatas pendentes renderizam no plot com contorno
 * tracejado âmbar ("sugestão — nada vira gate até você aceitar"), mesmo
 * espírito do rascunho de compensação. Formas normais de gate, apenas
 * com estilo distinto e não-editável.
 */
export const SUGGESTION_COLOR = "#d97706" // amber-600 — proposta, não gate

export interface SuggestionShape {
	type: string
	x0?: number | string
	x1?: number | string
	y0?: number | string
	y1?: number | string
	yref?: string
	xref?: string
	path?: string
	line: { color: string; width: number; dash: string }
	fillcolor?: string
	_suggestionId: number
}

const t = (v: number, scale: Scale) =>
	scale === "biex" ? biex(v, COFACTOR) : v

const matchAxes = (gc: GateCoordinates, xAxis: string, yAxis: string) => {
	if (!("x_axis" in gc) || !("y_axis" in gc)) return "none"
	if (!gc.x_axis || !gc.y_axis) return "none"
	if (gc.x_axis === xAxis && gc.y_axis === yAxis) return "exact"
	if (gc.x_axis === yAxis && gc.y_axis === xAxis) return "swapped"
	return "none"
}

const dashed = {
	color: hexToRgba(SUGGESTION_COLOR, 0.85),
	width: 2,
	dash: "dot",
}

/**
 * Converte candidatas pendentes em Plotly shapes para o par de canais em
 * tela. Candidatas de outros contextos (canais diferentes) não renderizam —
 * cada sugestão vale para o contexto onde foi pedida.
 */
export const buildSuggestionShapes = (
	suggestions: GateSuggestion[],
	xAxis: string,
	yAxis: string,
	xScale: Scale,
	yScale: Scale,
	plotMode: string,
): SuggestionShape[] => {
	if (plotMode === "histogram") return []
	return suggestions.flatMap((s): SuggestionShape[] => {
		const gc = s.gate_coordinates
		if (!gc) return []
		const match = matchAxes(gc, xAxis, yAxis)
		if (match === "none") return []
		const swapped = match === "swapped"
		const xs = swapped ? yScale : xScale
		const ys = swapped ? xScale : yScale

		if (gc.type === "rectangle") {
			const x0 = t(swapped ? gc.startY : gc.startX, xs)
			const x1 = t(swapped ? gc.endY : gc.endX, xs)
			const y0 = t(swapped ? gc.startX : gc.startY, ys)
			const y1 = t(swapped ? gc.endX : gc.endY, ys)
			return [
				{
					type: "rect",
					x0,
					x1,
					y0,
					y1,
					line: dashed,
					fillcolor: hexToRgba(SUGGESTION_COLOR, 0.06),
					_suggestionId: s.id,
				},
			]
		}

		if (gc.type === "polygon") {
			const path =
				gc.vertices
					.map((v, i) => {
						const px = t(swapped ? v[1] : v[0], xs)
						const py = t(swapped ? v[0] : v[1], ys)
						return `${i === 0 ? "M" : "L"} ${px} ${py}`
					})
					.join(" ") + " Z"
			return [
				{
					type: "path",
					path,
					line: dashed,
					fillcolor: hexToRgba(SUGGESTION_COLOR, 0.06),
					_suggestionId: s.id,
				},
			]
		}

		if (gc.type === "quadrant") {
			const cx = t(swapped ? gc.center_y : gc.center_x, xs)
			const cy = t(swapped ? gc.center_x : gc.center_y, ys)
			return [
				{
					type: "line",
					x0: cx,
					x1: cx,
					y0: 0,
					y1: 1,
					yref: "paper",
					line: dashed,
					_suggestionId: s.id,
				},
				{
					type: "line",
					x0: 0,
					x1: 1,
					xref: "paper",
					y0: cy,
					y1: cy,
					line: dashed,
					_suggestionId: s.id,
				},
			]
		}

		return []
	})
}
