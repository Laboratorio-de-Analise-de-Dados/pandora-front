import { describe, expect, it } from "vitest"
import { biex, COFACTOR, toRaw } from "./biex"
import { isDegenerateSelection } from "./gateSelection"
import { buildAxisRange } from "./plotAxes"

describe("isDegenerateSelection", () => {
	const linearRange = buildAxisRange("0", "1000", "linear", COFACTOR)

	it("rejeita clique sem arraste", () => {
		expect(isDegenerateSelection(500, 500, linearRange)).toBe(true)
	})

	it("rejeita arraste menor que 1% do eixo", () => {
		expect(isDegenerateSelection(500, 505, linearRange)).toBe(true)
	})

	it("aceita arraste com area util", () => {
		expect(isDegenerateSelection(200, 800, linearRange)).toBe(false)
	})

	it("independe do sentido do arraste", () => {
		expect(isDegenerateSelection(800, 200, linearRange)).toBe(false)
	})

	it("usa o range exibido em biex", () => {
		const biexRange = buildAxisRange("0", "1000000", "biex", COFACTOR)
		const span = biexRange[1] - biexRange[0]
		expect(isDegenerateSelection(1, 1 + span * 0.5, biexRange)).toBe(false)
		expect(isDegenerateSelection(1, 1 + span * 0.001, biexRange)).toBe(true)
	})
})

describe("conversao de coordenadas do gate", () => {
	it("mantem o valor em escala linear", () => {
		expect(toRaw(1234, "linear", COFACTOR)).toBe(1234)
	})

	it("faz round-trip em biex", () => {
		for (const raw of [0, 10, 1000, 250000]) {
			expect(toRaw(biex(raw, COFACTOR), "biex", COFACTOR)).toBeCloseTo(raw, 4)
		}
	})

	it("normaliza os cantos do retangulo independente da origem do arraste", () => {
		const a = toRaw(biex(50000, COFACTOR), "biex", COFACTOR)
		const b = toRaw(biex(1000, COFACTOR), "biex", COFACTOR)
		expect(Math.min(a, b)).toBeCloseTo(1000, 4)
		expect(Math.max(a, b)).toBeCloseTo(50000, 4)
	})
})
