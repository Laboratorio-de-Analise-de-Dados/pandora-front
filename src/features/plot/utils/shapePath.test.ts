import { describe, expect, it } from "vitest"
import { parseShapePath, shapePathToVertices } from "./shapePath"

describe("parseShapePath", () => {
	it("lê segmentos M/L e ignora o Z de fechamento", () => {
		expect(parseShapePath("M 1 2 L 3 4 L 5 2 Z")).toEqual([
			[1, 2],
			[3, 4],
			[5, 2],
		])
	})

	it("aceita vírgula e notação compacta do Plotly", () => {
		expect(parseShapePath("M1,2L3,4Z")).toEqual([
			[1, 2],
			[3, 4],
		])
	})
})

describe("shapePathToVertices", () => {
	it("converte path transladado de volta a vértices crus (linear)", () => {
		// Polígono transladado +5 em x e −1 em y no espaço de display.
		const path = "M 6 1 L 8 3 L 10 1 Z"
		expect(shapePathToVertices(path, false, "linear", "linear")).toEqual([
			[6, 1],
			[8, 3],
			[10, 1],
		])
	})

	it("delta uniforme preserva a forma: todos os vértices deslocam igual", () => {
		const before = shapePathToVertices(
			"M 1 2 L 3 4 L 5 2 Z",
			false,
			"linear",
			"linear",
		)
		const after = shapePathToVertices(
			"M 4 7 L 6 9 L 8 7 Z",
			false,
			"linear",
			"linear",
		)
		after.forEach(([x, y], i) => {
			expect(x - before[i][0]).toBeCloseTo(3)
			expect(y - before[i][1]).toBeCloseTo(5)
		})
	})

	it("eixo swapped inverte x/y ao voltar para o espaço do gate", () => {
		expect(
			shapePathToVertices("M 1 2 L 3 4 Z", true, "linear", "linear"),
		).toEqual([
			[2, 1],
			[4, 3],
		])
	})

	it("escala não-linear aplica o inverso do transform por eixo", () => {
		// biex: toRaw(v) = sinh(v) * 150
		const [[x]] = shapePathToVertices("M 1 0 Z", false, "biex", "linear")
		expect(x).toBeCloseTo(Math.sinh(1) * 150)
	})
})
