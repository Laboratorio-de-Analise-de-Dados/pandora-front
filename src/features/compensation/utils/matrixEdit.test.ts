import { describe, expect, it } from "vitest"
import {
	changedCellKeys,
	formatPercentCell,
	identityMatrix,
	invalidCellKeys,
	parsePercentCell,
	parsePercentGrid,
} from "./matrixEdit"

describe("identityMatrix", () => {
	it("cria grade N×N com 1 na diagonal e 0 fora", () => {
		expect(identityMatrix(2)).toEqual([
			[1, 0],
			[0, 1],
		])
		expect(identityMatrix(1)).toEqual([[1]])
	})
})

describe("formatPercentCell", () => {
	it("converte fração para % com uma casa", () => {
		expect(formatPercentCell(1)).toBe("100.0")
		expect(formatPercentCell(0.052)).toBe("5.2")
		expect(formatPercentCell(0)).toBe("0.0")
	})
})

describe("parsePercentCell", () => {
	it("converte % para fração", () => {
		expect(parsePercentCell("100")).toBe(1)
		expect(parsePercentCell("5.2")).toBeCloseTo(0.052)
		expect(parsePercentCell("5,2")).toBeCloseTo(0.052)
		expect(parsePercentCell("0")).toBe(0)
	})

	it("rejeita vazio e não-numérico", () => {
		expect(parsePercentCell("")).toBeNull()
		expect(parsePercentCell("  ")).toBeNull()
		expect(parsePercentCell("abc")).toBeNull()
		expect(parsePercentCell("1.2.3")).toBeNull()
	})
})

describe("parsePercentGrid", () => {
	it("mantém null por célula inválida", () => {
		expect(
			parsePercentGrid([
				["100", "x"],
				["0", "1,5"],
			]),
		).toEqual([
			[1, null],
			[0, 0.015],
		])
	})
})

describe("invalidCellKeys", () => {
	it("lista só as células inválidas", () => {
		expect(
			invalidCellKeys([
				["100", "abc"],
				["", "0"],
			]),
		).toEqual(new Set(["0,1", "1,0"]))
	})
})

describe("changedCellKeys", () => {
	it("detecta divergências em relação à origem", () => {
		const origin = [
			[1, 0.05],
			[0.1, 1],
		]
		const same = [
			[1, 0.05],
			[0.1, 1],
		]
		expect(changedCellKeys(origin, same)).toEqual(new Set())
		const edited = [
			[1, 0.05],
			[0.2, 1],
		]
		expect(changedCellKeys(origin, edited)).toEqual(new Set(["1,0"]))
	})

	it("tolera round-trip de % (formata e parseia de volta)", () => {
		const origin = [[0.052]]
		const edited = parsePercentGrid([[formatPercentCell(0.052)]])
		expect(changedCellKeys(origin, edited as number[][])).toEqual(new Set())
	})
})
