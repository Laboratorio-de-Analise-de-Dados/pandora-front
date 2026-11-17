import type { Scale } from "../../../types"
import { COFACTOR, toRaw } from "./biex"

/** Parseia o `path` SVG de uma shape editável do Plotly
 * ("M x y L x y … Z") em pontos no espaço de display. */
export const parseShapePath = (path: string): [number, number][] => {
	const vertices: [number, number][] = []
	const re =
		/[ML]\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)[\s,]+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi
	let m: RegExpExecArray | null
	while ((m = re.exec(path)) !== null) {
		vertices.push([parseFloat(m[1]), parseFloat(m[2])])
	}
	return vertices
}

/** Converte o path exibido (após arraste/reshape no Plotly) de volta para
 * vértices crus do gate — inverte o `toDisplay` por eixo e o swap x/y. */
export const shapePathToVertices = (
	path: string,
	swapped: boolean,
	xScale: Scale,
	yScale: Scale,
): [number, number][] =>
	parseShapePath(path).map(([px, py]) => {
		const rawX = toRaw(px, xScale, COFACTOR)
		const rawY = toRaw(py, yScale, COFACTOR)
		return swapped ? [rawY, rawX] : [rawX, rawY]
	})
