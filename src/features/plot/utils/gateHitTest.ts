import type { Gate, GateCoordinates, Scale } from "../../../types"
import { COFACTOR, toDisplay } from "./biex"
import { pointInPolygon } from "./geometry"

// Sinal de cada quadrante nos eixos crus do gate: [xSign, ySign].
// Convenção igual à do backend (`utils/density.py`) e do `useGateDrawing`.
export const QUADRANT_DIR: Record<string, [number, number]> = {
	Q1: [1, 1],
	Q2: [-1, 1],
	Q3: [-1, -1],
	Q4: [1, -1],
}

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
		const x0 = toDisplay(swapped ? rect.startY : rect.startX, xs, cof)
		const x1 = toDisplay(swapped ? rect.endY : rect.endX, xs, cof)
		const y0 = toDisplay(swapped ? rect.startX : rect.startY, ys, cof)
		const y1 = toDisplay(swapped ? rect.endX : rect.endY, ys, cof)
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
			const dx = toDisplay(rawX, xs, cof)
			const dy = toDisplay(rawY, ys, cof)
			return [dx, dy] as [number, number]
		})
		return pointInPolygon(dataX, dataY, verts)
	}

	// Quadrante: a "área" do gate é a região inteira que ele corta — clicar em
	// qualquer ponto da região (não só na linha da cruz) acerta o gate.
	if (gateType === "quadrant" && "center_x" in gc && "center_y" in gc) {
		const quad = gc as {
			center_x: number
			center_y: number
			quadrant?: string
		}
		const dir = QUADRANT_DIR[quad.quadrant ?? ""]
		if (!dir) return false
		const cx = toDisplay(swapped ? quad.center_y : quad.center_x, xs, cof)
		const cy = toDisplay(swapped ? quad.center_x : quad.center_y, ys, cof)
		const xDir = swapped ? dir[1] : dir[0]
		const yDir = swapped ? dir[0] : dir[1]
		return (
			(xDir > 0 ? dataX >= cx : dataX < cx) &&
			(yDir > 0 ? dataY >= cy : dataY < cy)
		)
	}

	if (gateType === "interval" && "startX" in gc && "endX" in gc) {
		const intv = gc as { startX: number; endX: number }
		const x0 = toDisplay(intv.startX, effXScale, cof)
		const x1 = toDisplay(intv.endX, effXScale, cof)
		const minX = Math.min(x0, x1),
			maxX = Math.max(x0, x1)
		return dataX >= minX && dataX <= maxX
	}

	return false
}

/**
 * Devolve os gates do mesmo conjunto de quadrantes que `gate` — os 4
 * gates criados juntos dividem a mesma cruz (mesmo parent, mesma amostra,
 * mesmo centro e mesmos eixos). Excluir um sem os outros deixaria um
 * conjunto incompleto, então a família é tratada como unidade.
 */
export const findQuadrantFamily = (gates: Gate[], gate: Gate): Gate[] => {
	const gc = gate.gate_coordinates
	if (gc?.type !== "quadrant") return [gate]
	return gates.filter((g) => {
		const c = g.gate_coordinates
		return (
			c?.type === "quadrant" &&
			g.parent_id === gate.parent_id &&
			g.file_data === gate.file_data &&
			c.center_x === gc.center_x &&
			c.center_y === gc.center_y &&
			c.x_axis === gc.x_axis &&
			c.y_axis === gc.y_axis
		)
	})
}
