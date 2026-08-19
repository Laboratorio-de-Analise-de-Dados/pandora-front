import type { GateCoordinates, Scale } from "../../../types"
import { COFACTOR, biex } from "./biex"
import { pointInPolygon } from "./geometry"

/**
 * Testa se um ponto (em coordenadas de dados) cai dentro do gate descrito por
 * `gc`, considerando a escala efetiva de cada eixo e o eventual swap X/Y.
 */
export const isPointInGate = (
	dataX: number,
	dataY: number,
	gc: GateCoordinates,
	swapped: boolean,
	effXScale: Scale,
	effYScale: Scale,
): boolean => {
	const gateType = gc.type ?? "rectangle"
	const cof = COFACTOR
	const xs = swapped ? effYScale : effXScale
	const ys = swapped ? effXScale : effYScale

	if (gateType === "rectangle" && "startX" in gc && "startY" in gc) {
		const rect = gc as {
			startX: number
			startY: number
			endX: number
			endY: number
		}
		const x0 =
			xs === "biex"
				? biex(swapped ? rect.startY : rect.startX, cof)
				: swapped
					? rect.startY
					: rect.startX
		const x1 =
			xs === "biex"
				? biex(swapped ? rect.endY : rect.endX, cof)
				: swapped
					? rect.endY
					: rect.endX
		const y0 =
			ys === "biex"
				? biex(swapped ? rect.startX : rect.startY, cof)
				: swapped
					? rect.startX
					: rect.startY
		const y1 =
			ys === "biex"
				? biex(swapped ? rect.endX : rect.endY, cof)
				: swapped
					? rect.endX
					: rect.endY
		const minX = Math.min(x0, x1),
			maxX = Math.max(x0, x1)
		const minY = Math.min(y0, y1),
			maxY = Math.max(y0, y1)
		return dataX >= minX && dataX <= maxX && dataY >= minY && dataY <= maxY
	}

	if (gateType === "polygon" && "vertices" in gc) {
		const verts = (gc.vertices as [number, number][]).map((v) => {
			const rawX = swapped ? v[1] : v[0]
			const rawY = swapped ? v[0] : v[1]
			const dx = xs === "biex" ? biex(rawX, cof) : rawX
			const dy = ys === "biex" ? biex(rawY, cof) : rawY
			return [dx, dy] as [number, number]
		})
		return pointInPolygon(dataX, dataY, verts)
	}

	if (gateType === "interval" && "startX" in gc && "endX" in gc) {
		const intv = gc as { startX: number; endX: number }
		const x0 = effXScale === "biex" ? biex(intv.startX, cof) : intv.startX
		const x1 = effXScale === "biex" ? biex(intv.endX, cof) : intv.endX
		const minX = Math.min(x0, x1),
			maxX = Math.max(x0, x1)
		return dataX >= minX && dataX <= maxX
	}

	return false
}
