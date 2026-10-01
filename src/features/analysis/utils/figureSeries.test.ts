import { describe, expect, it } from "vitest"
import type { AnalysisResultData } from "../../../types"
import type {
	FigureResultRow,
	FigureStatsTestResult,
} from "../../../services/figureService"
import {
	buildFigureCsvRows,
	buildStatsTraces,
	channelLabel,
	groupAggregates,
	metricValue,
	normalizeChannelKey,
	populationLabel,
	pToStars,
	ROOT_POPULATION,
	statsTestLabel,
} from "./figureSeries"

const ar = (
	overrides: Partial<AnalysisResultData> = {},
): AnalysisResultData => ({
	summary_metrics: {
		count: 1000,
		percent_of_total_population: 0.05,
		percent_of_parent_population: 0.25,
	},
	// chaves normalizadas, como o backend persiste (normalize_column_name)
	channel_statistics: {
		pe_a: { mean_mfi: 1200, median_mfi: 1100, std_dev: 300, cv: 27.3 },
	},
	...overrides,
})

describe("normalizeChannelKey / channelLabel", () => {
	it("espelha normalize_column_name do back e é idempotente", () => {
		expect(normalizeChannelKey("PE-A")).toBe("pe_a")
		expect(normalizeChannelKey("APC-Cy7-A")).toBe("apc_cy7_a")
		expect(normalizeChannelKey("pe_a")).toBe("pe_a")
	})

	it("channelLabel mapeia a chave do spec pro nome de exibição", () => {
		expect(channelLabel("pe_a", ["FSC-A", "PE-A"])).toBe("PE-A")
		expect(channelLabel("desconhecido", ["PE-A"])).toBe("desconhecido")
		expect(channelLabel(undefined, [])).toBe("")
	})
})

describe("metricValue", () => {
	it("percentuais vêm de summary_metrics como fração (contrato)", () => {
		expect(metricValue(ar(), "percent_parent")).toBeCloseTo(0.25)
		expect(metricValue(ar(), "percent_total")).toBeCloseTo(0.05)
	})

	it("métricas de canal vêm de channel_statistics (chave normalizada)", () => {
		expect(metricValue(ar(), "median_mfi", "pe_a")).toBe(1100)
		expect(metricValue(ar(), "cv", "pe_a")).toBeCloseTo(27.3)
		// tolerante a nome de exibição (spec antigo) — normalização idempotente
		expect(metricValue(ar(), "median_mfi", "PE-A")).toBe(1100)
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
		// rows cruas + seção de agregados por grupo (FE-36 §6)
		expect(csv.some((r) => r[0] === "Agregados por grupo")).toBe(true)
		const aggHeader = csv.findIndex((r) => r[0] === "População" && r[2] === "n")
		expect(csv[aggHeader + 1]).toEqual([
			"CD4",
			"D0",
			"2",
			"1500.00",
			"707.11",
			"1500.00",
		])
	})

	it("CSV inclui seção de stats_tests quando presente", () => {
		const tests: FigureStatsTestResult[] = [
			{
				population: "CD4",
				method: "parametric",
				omnibus: { test: "one_way_anova", F: 4.2, p: 0.012, df: [2, 21] },
				pairwise: [
					{
						group_a: "D0",
						group_b: "D7",
						t: 2.9,
						p: 0.008,
						p_adj: 0.032,
						method: "welch_t",
					},
				],
				n_per_group: { D0: 2, D7: 1 },
				warnings: ['grupo "D7" com n<3 — teste omitido'],
			},
		]
		const csv = buildFigureCsvRows(
			"Fig",
			1,
			undefined,
			"median_mfi",
			rows,
			tests,
		)
		expect(
			csv.some((r) =>
				r[0]?.includes("Testes estatísticos — CD4: ANOVA + Welch t (BH)"),
			),
		).toBe(true)
		expect(csv.some((r) => r[0] === "omnibus" && r[2] === "F=4.2")).toBe(true)
		expect(
			csv.some(
				(r) => r[0] === "par" && r[1] === "D0 vs D7" && r[4] === "p_adj=0.032",
			),
		).toBe(true)
		expect(csv.some((r) => r[0] === "aviso" && r[1]?.includes("n<3"))).toBe(
			true,
		)
	})
})

describe("groupAggregates / pToStars", () => {
	it("agrega n, média, SD (ddof=1) e mediana por grupo × população", () => {
		const aggs = groupAggregates(rows)
		expect(aggs).toHaveLength(3)
		const cd4d0 = aggs.find((a) => a.population === "CD4" && a.group === "D0")!
		expect(cd4d0.n).toBe(2)
		expect(cd4d0.mean).toBe(15)
		expect(cd4d0.sd).toBeCloseTo(Math.sqrt(50))
		expect(cd4d0.median).toBe(15)
		const cd4d7 = aggs.find((a) => a.population === "CD4" && a.group === "D7")!
		expect(cd4d7.n).toBe(1)
		expect(cd4d7.sd).toBe(0)
	})

	it("pToStars segue a notação Prism sobre p ajustado", () => {
		expect(pToStars(0.0005)).toBe("***")
		expect(pToStars(0.005)).toBe("**")
		expect(pToStars(0.03)).toBe("*")
		expect(pToStars(0.2)).toBe("ns")
	})

	it("statsTestLabel expõe a metodologia efetiva (chip + CSV)", () => {
		const base: FigureStatsTestResult = {
			population: "P1",
			method: "nonparametric",
			omnibus: { test: "kruskal_wallis", H: 8.1, p: 0.02, df: [3] },
			pairwise: [
				{
					group_a: "A",
					group_b: "B",
					U: 12,
					p: 0.01,
					p_adj: 0.04,
					method: "mann_whitney_u",
				},
			],
			n_per_group: {},
			warnings: [],
		}
		expect(statsTestLabel(base)).toBe("Kruskal-Wallis + Mann-Whitney (BH)")
		// sem omnibus e sem pairwise → cai no rótulo do método
		expect(statsTestLabel({ ...base, omnibus: null, pairwise: [] })).toBe(
			"nonparametric",
		)
	})
})
