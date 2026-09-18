import type { Gate, Scale } from "../../../types"
import { biex, COFACTOR } from "./biex"
import { getGateColor, hexToRgba } from "../../../constants/gateColors"
import { QUADRANT_DIR } from "./gateHoverTraces"

type PointTest = (x: number, y: number) => boolean

const pointInPolygon = (
	x: number,
	y: number,
	verts: [number, number][],
): boolean => {
	let inside = false
	for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
		const [xi, yi] = verts[i]
		const [xj, yj] = verts[j]
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
			inside = !inside
	}
	return inside
}

/**
 * Predicado "ponto dentro do gate" em espaço de exibição (biex já
 * aplicado — mesmo espaço de data.x/data.y e dos shapes desenhados).
 * Eixos trocados seguem a mesma convenção de `useGateShapes`.
 */
const gatePointTest = (
	gate: Gate,
	xAxis: string,
	yAxis: string,
	effXScale: Scale,
	effYScale: Scale,
): PointTest | null => {
	const gc = gate.gate_coordinates
	if (!gc) return null
	const type = gc.type ?? "rectangle"
	const gx = "x_axis" in gc ? gc.x_axis : undefined
	const gy = "y_axis" in gc ? gc.y_axis : undefined
	if (!gx || !gy) return null
	const swapped = gx === yAxis && gy === xAxis
	if (!(gx === xAxis && gy === yAxis) && !swapped) return null

	const xSc = swapped ? effYScale : effXScale
	const ySc = swapped ? effXScale : effYScale
	const tx = (v: number) => (xSc === "biex" ? biex(v, COFACTOR) : v)
	const ty = (v: number) => (ySc === "biex" ? biex(v, COFACTOR) : v)

	if (type === "rectangle" && "startX" in gc && "startY" in gc) {
		const [x0, x1] = [
			tx(swapped ? gc.startY : gc.startX),
			tx(swapped ? gc.endY : gc.endX),
		].sort((a, b) => a - b)
		const [y0, y1] = [
			ty(swapped ? gc.startX : gc.startY),
			ty(swapped ? gc.endX : gc.endY),
		].sort((a, b) => a - b)
		return (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1
	}

	if (type === "polygon" && "vertices" in gc) {
		const verts = gc.vertices.map((v: [number, number]): [number, number] =>
			swapped ? [tx(v[1]), ty(v[0])] : [tx(v[0]), ty(v[1])],
		)
		return (x, y) => pointInPolygon(x, y, verts)
	}

	if (type === "quadrant" && "center_x" in gc && "center_y" in gc) {
		const dir = QUADRANT_DIR[gc.quadrant]
		if (!dir) return null
		const cx = tx(swapped ? gc.center_y : gc.center_x)
		const cy = ty(swapped ? gc.center_x : gc.center_y)
		const xDir = swapped ? dir[1] : dir[0]
		const yDir = swapped ? dir[0] : dir[1]
		return (x, y) =>
			(xDir > 0 ? x >= cx : x < cx) && (yDir > 0 ? y >= cy : y < cy)
	}

	return null
}

/**
 * "Color gating" (convenção FlowJo): evento do scatter dentro de um
 * gate visível ganha a cor do gate — as populações ficam legíveis sem
 * abrir gate por gate. Em sobreposição o último gate da lista vence.
 * Retorna null quando nenhum gate dos eixos atuais é avaliável (aí o
 * scatter fica na cor base, como antes).
 */
export const scatterGatePointColors = (
	xs: number[] | undefined,
	ys: number[] | undefined,
	gates: Gate[],
	xAxis: string,
	yAxis: string,
	effXScale: Scale,
	effYScale: Scale,
	baseColor: string,
): string[] | null => {
	if (!xs || !ys || xs.length !== ys.length) return null
	const tests: { color: string; test: PointTest }[] = []
	gates.forEach((gate, i) => {
		const test = gatePointTest(gate, xAxis, yAxis, effXScale, effYScale)
		if (test)
			tests.push({
				color: hexToRgba(getGateColor(gate.color, i), 0.85),
				test,
			})
	})
	if (!tests.length) return null
	return xs.map((x, i) => {
		const y = ys[i]
		for (let g = tests.length - 1; g >= 0; g--) {
			if (tests[g].test(x, y)) return tests[g].color
		}
		return baseColor
	})
}
