import { describe, expect, it } from "vitest"
import type { AnalysisResultData } from "../../../types"
import type { FigureResultRow } from "../../../services/figureService"
import {
	buildFigureCsvRows,
	buildStatsTraces,
	metricValue,
	populationLabel,
	ROOT_POPULATION,
} from "./figureSeries"

const ar = (
	overrides: Partial<AnalysisResultData> = {},
): AnalysisResultData => ({
	summary_metrics: {
		count: 1000,
		percent_of_total_population: 0.05,
		percent_of_parent_population: 0.25,
	},
	channel_statistics: {
		"PE-A": { mean_mfi: 1200, median_mfi: 1100, std_dev: 300, cv: 27.3 },
	},
	...overrides,
})

describe("metricValue", () => {
	it("percentuais vêm de summary_metrics como fração (contrato)", () => {
		expect(metricValue(ar(), "percent_parent")).toBeCloseTo(0.25)
		expect(metricValue(ar(), "percent_total")).toBeCloseTo(0.05)
	})

	it("métricas de canal vêm de channel_statistics", () => {
		expect(metricValue(ar(), "median_mfi", "PE-A")).toBe(1100)
		expect(metricValue(ar(), "cv", "PE-A")).toBeCloseTo(27.3)
	})

	it("ausente é ausente — canal inexistente, applicable=false, sem stats", () => {
		expect(metricValue(ar(), "median_mfi", "FITC-A")).toBeUndefined()
		expect(
			metricValue(ar({ applicable: false }), "median_mfi", "PE-A"),
		).toBeUndefined()
		expect(metricValue(undefined, "percent_parent")).toBeUndefined()
	})
})

const rows: FigureResultRow[] = [
	{
		group: "D0",
		file_data_id: 1,
		file_name: "d0-1.fcs",
		population: "CD4",
		value: 10,
	},
	{
		group: "D0",
		file_data_id: 2,
		file_name: "d0-2.fcs",
		population: "CD4",
		value: 20,
	},
	{
		group: "D7",
		file_data_id: 3,
		file_name: "d7-1.fcs",
		population: "CD4",
		value: 30,
	},
	{
		group: "D0",
		file_data_id: 1,
		file_name: "d0-1.fcs",
		population: "CD8",
		value: 5,
	},
]

describe("buildStatsTraces", () => {
	it("stats_bar agrega por média das amostras do grupo", () => {
		const [cd4, cd8] = buildStatsTraces(
			rows,
			["CD4", "CD8"],
			["D0", "D7"],
			"stats_bar",
			"median_mfi",
		)
		expect(cd4.type).toBe("bar")
		expect(cd4.x).toEqual(["D0", "D7"])
		expect(cd4.y).toEqual([15, 30])
		expect(cd4.text).toEqual(["n=2", "n=1"])
		expect(cd8.y[1]).toBeNaN() // sem dados → ausente, não zero
	})

	it("stats_strip emite um ponto por amostra", () => {
		const [cd4] = buildStatsTraces(
			rows,
			["CD4"],
			["D0", "D7"],
			"stats_strip",
			"median_mfi",
		)
		expect(cd4.type).toBe("scatter")
		expect(cd4.x).toEqual(["D0", "D0", "D7"])
		expect(cd4.y).toEqual([10, 20, 30])
		expect(cd4.text).toEqual(["d0-1.fcs", "d0-2.fcs", "d7-1.fcs"])
	})
})

describe("populationLabel / buildFigureCsvRows", () => {
	it("rótulo de população usa o último segmento; 'file' vira Amostra inteira", () => {
		expect(populationLabel("Linf/CD3/CD4")).toBe("CD4")
		expect(populationLabel(ROOT_POPULATION)).toBe("Amostra inteira")
	})

	it("CSV carrega cabeçalho de proveniência e formata percentuais", () => {
		const csv = buildFigureCsvRows(
			"Fig",
			42,
			"2026-09-30T10:00:00Z",
			"percent_parent",
			rows,
		)
		expect(csv[0][0]).toContain("Fig")
		expect(csv[1][0]).toContain("42")
		expect(csv[2][0]).toContain("2026-09-30")
		expect(csv[4]).toEqual(["Grupo", "Amostra", "População", "% do pai"])
		// fração 10 → 1000.00% (dados sintéticos)
		expect(csv[5][3]).toBe("1000.00")
		expect(csv).toHaveLength(5 + rows.length)
	})
})
