import { describe, expect, it } from "vitest"
import { buildAnalysisRows } from "./statsRows"
import type { PopulationRow } from "./statsRows"
import { fmtPct } from "../../../utils/format"

const populations: PopulationRow[] = [
	{
		fileName: "amostra.fcs",
		strategy: "P1/P2",
		name: "P2",
		analysis: {
			summary_metrics: {
				count: 250,
				percent_of_parent_population: 0.25,
				percent_of_total_population: 0.05,
			},
			channel_statistics: {
				"FITC-A": { mean_mfi: 10, median_mfi: 9, std_dev: 2, cv: 20 },
			},
		},
	},
]

describe("buildAnalysisRows", () => {
	const rows = buildAnalysisRows(
		populations,
		["FITC-A"],
		[{ key: "mean_mfi", shortLabel: "Mean" }],
		(ch) => ch,
	)
	const [header, row] = rows

	it("mantem %Parent antes de %Total no cabecalho e nos dados", () => {
		expect(header.slice(3, 6)).toEqual(["Count", "%Parent (%P)", "%Total (%T)"])
		expect(row[header.indexOf("%Parent (%P)")]).toBe("25.00")
		expect(row[header.indexOf("%Total (%T)")]).toBe("5.00")
	})

	it("exporta os mesmos percentuais que a tela formata", () => {
		expect(`${row[4]}%`).toBe(fmtPct(0.25))
		expect(`${row[5]}%`).toBe(fmtPct(0.05))
	})

	it("inclui as metricas de canal depois dos percentuais", () => {
		expect(header[6]).toBe("FITC-A_Mean")
		expect(row[6]).toBe("10")
	})
})
