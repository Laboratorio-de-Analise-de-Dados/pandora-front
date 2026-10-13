import { describe, expect, it } from "vitest"
import { biex, COFACTOR, defaultScale, logT, toDisplay, toRaw } from "./biex"

describe("toDisplay / toRaw", () => {
	it("identidade em linear", () => {
		expect(toDisplay(1234, "linear", COFACTOR)).toBe(1234)
		expect(toRaw(1234, "linear", COFACTOR)).toBe(1234)
	})

	it("round-trip em biex", () => {
		for (const raw of [0, 10, 1000, 250000]) {
			expect(
				toRaw(toDisplay(raw, "biex", COFACTOR), "biex", COFACTOR),
			).toBeCloseTo(raw, 4)
		}
	})

	it("round-trip em log", () => {
		for (const raw of [1, 10, 1000, 10000000]) {
			expect(
				toRaw(toDisplay(raw, "log", COFACTOR), "log", COFACTOR),
			).toBeCloseTo(raw, 4)
		}
	})

	it("log clipa valores <= 1 em zero — igual ao apply_scale do back", () => {
		expect(logT(0)).toBe(0)
		expect(logT(-500)).toBe(0)
		expect(logT(1)).toBe(0)
		expect(logT(10)).toBe(1)
		expect(logT(10000000)).toBe(7)
	})
})

describe("defaultScale", () => {
	it("heurística sem metadado: FSC/SSC/Time linear, resto biex", () => {
		expect(defaultScale("FSC-A")).toBe("linear")
		expect(defaultScale("SSC-H")).toBe("linear")
		expect(defaultScale("Time")).toBe("linear")
		expect(defaultScale("PE-A")).toBe("biex")
	})

	it("$PnE com décadas > 0 vira log (amplificador log do detector)", () => {
		const meta = [{ name: "FL1-A", log_decades: 4.5 }]
		expect(defaultScale("FL1-A", meta)).toBe("log")
	})

	it("$PnE 0,0 vira linear mesmo em canal fluorescente", () => {
		const meta = [{ name: "PE-A", log_decades: 0 }]
		expect(defaultScale("PE-A", meta)).toBe("linear")
	})

	it("canal ausente no metadado cai na heurística", () => {
		const meta = [{ name: "FSC-A", log_decades: 0 }]
		expect(defaultScale("PE-A", meta)).toBe("biex")
	})
})
