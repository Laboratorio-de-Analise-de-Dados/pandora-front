import { describe, expect, it } from "vitest"
import { COFACTOR } from "./biex"
import { buildTicks } from "./ticks"

describe("buildTicks", () => {
	it("linear não gera ticks customizados", () => {
		expect(buildTicks([0, 1000000], "linear", COFACTOR)).toBeUndefined()
	})

	it("log: ticks nas décadas dentro do range do eixo", () => {
		const ticks = buildTicks([0, 7], "log", COFACTOR)
		expect(ticks?.tickvals).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
		expect(ticks?.ticktext[0]).toBe("10⁰")
		expect(ticks?.ticktext[7]).toBe("10⁷")
	})

	it("log: range parcial cobre só as décadas inteiras visíveis", () => {
		const ticks = buildTicks([1.5, 4.2], "log", COFACTOR)
		expect(ticks?.tickvals).toEqual([2, 3, 4])
	})

	it("biex mantém os ticks em unidades reais", () => {
		const ticks = buildTicks([-10, 12], "biex", COFACTOR)
		expect(ticks?.ticktext).toContain("10⁶")
	})
})
