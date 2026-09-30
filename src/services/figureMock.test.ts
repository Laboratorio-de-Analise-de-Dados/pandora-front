import { beforeEach, describe, expect, it } from "vitest"
import type { AnalysisResultData, ExperimentFiles, Gate } from "../types"
import {
	mockCreateFigure,
	mockDeleteFigure,
	mockGetFigure,
	mockListFigures,
	mockRecomputeFigure,
	mockUpdateFigure,
	resetFigureMockStore,
	type FigureMockDeps,
} from "./figureMock"
import { ROOT_POPULATION } from "../features/analysis/utils/figureSeries"

const gate = (
	id: number,
	name: string,
	ar?: AnalysisResultData,
	children?: Gate[],
): Gate => ({
	id,
	name,
	parent_id: null,
	gate_coordinates: {} as never,
	file_data: 0,
	dashboard: 0,
	children,
	analysis_result: ar ? { analysis_result: ar } : undefined,
})

const stats = (median: number, pctParent = 0.5): AnalysisResultData => ({
	summary_metrics: {
		count: 1000,
		percent_of_total_population: 0.1,
		percent_of_parent_population: pctParent,
	},
	channel_statistics: {
		pe_a: { mean_mfi: median, median_mfi: median, std_dev: 10, cv: 5 },
	},
})

const deps = (files: ExperimentFiles[]): FigureMockDeps => ({
	files,
	fetchStats: async (id) => stats(500 + id),
	currentUserName: "tester",
})

const makeFile = (id: number, gates: Gate[] = []): ExperimentFiles => ({
	id,
	file_name: `f${id}.fcs`,
	gates,
	active: true,
	deactivated_at: null,
})

describe("figureMock — contrato BE-33", () => {
	beforeEach(() => resetFigureMockStore())

	it("cria figura com result_cache computado das stats reais", async () => {
		const files = [
			makeFile(1, [gate(11, "CD4", stats(100))]),
			makeFile(2, [gate(21, "CD4", stats(200))]),
		]
		const figure = await mockCreateFigure(
			9,
			{
				name: "CD4 mediana",
				chart_type: "stats_bar",
				spec: {
					groups: [{ name: "G1", file_data_ids: [1, 2] }],
					populations: ["CD4"],
					metric: "median_mfi",
					channel: "pe_a",
				},
			},
			deps(files),
		)
		expect(figure.result_revision).toBe(1)
		expect(figure.is_stale).toBe(false)
		expect(figure.result_cache?.rows).toHaveLength(2)
		expect(figure.result_cache?.rows.map((r) => r.value)).toEqual([100, 200])
		expect(figure.result_cache?.resolved_inputs.gate_ids).toEqual([11, 21])
	})

	it("população 'file' usa stats de raiz da amostra", async () => {
		const files = [makeFile(3)]
		const figure = await mockCreateFigure(
			9,
			{
				name: "root",
				chart_type: "stats_strip",
				spec: {
					groups: [{ name: "G", file_data_ids: [3] }],
					populations: [ROOT_POPULATION],
					metric: "percent_parent",
				},
			},
			deps(files),
		)
		// percent_parent é fração crua (0.5) — % só na exibição.
		expect(figure.result_cache?.rows[0].value).toBeCloseTo(0.5)
	})

	it("gate ausente não vira zero — entra em unmatched", async () => {
		const files = [makeFile(1, [gate(11, "CD4", stats(100))]), makeFile(2)]
		const figure = await mockCreateFigure(
			9,
			{
				name: "f",
				chart_type: "stats_bar",
				spec: {
					groups: [{ name: "G", file_data_ids: [1, 2] }],
					populations: ["CD4", "CD8"],
					metric: "median_mfi",
					channel: "pe_a",
				},
			},
			deps(files),
		)
		const rows = figure.result_cache!.rows
		expect(rows).toHaveLength(1)
		expect(figure.result_cache!.unmatched.populations).toEqual(["CD8"])
		expect(
			figure.result_cache!.unmatched.files.map((f) => f.file_data_id),
		).toContain(2)
	})

	it("marca stale quando a resolução muda e recompute devolve removidos", async () => {
		const files = [
			makeFile(1, [gate(11, "CD4", stats(100))]),
			makeFile(2, [gate(21, "CD4", stats(200))]),
		]
		const d = deps(files)
		const figure = await mockCreateFigure(
			9,
			{
				name: "f2",
				chart_type: "stats_bar",
				spec: {
					groups: [{ name: "G", file_data_ids: [1, 2] }],
					populations: ["CD4"],
					metric: "median_mfi",
					channel: "pe_a",
				},
			},
			d,
		)
		// amostra 2 perdeu o gate CD4 (renomeado) → figura fica stale
		const changedFiles = [files[0], makeFile(2, [gate(21, "CD8", stats(200))])]
		const read = await mockGetFigure(figure.id, deps(changedFiles))
		expect(read.is_stale).toBe(true)

		const result = await mockRecomputeFigure(figure.id, deps(changedFiles))
		expect(result.figure.is_stale).toBe(false)
		expect(result.figure.result_revision).toBe(2)
		expect(result.figure.result_cache?.rows).toHaveLength(1)
		expect(result.removed_since_last.files).toEqual([
			{ file_data_id: 2, file_name: "f2.fcs" },
		])
	})

	it("update marca stale em mudança de spec e trava figura publicada", async () => {
		const d = deps([makeFile(1, [gate(11, "CD4", stats(1))])])
		const figure = await mockCreateFigure(
			9,
			{
				name: "f3",
				chart_type: "stats_bar",
				spec: {
					groups: [{ name: "G", file_data_ids: [1] }],
					populations: ["CD4"],
					metric: "median_mfi",
					channel: "pe_a",
				},
			},
			d,
		)
		const renamed = await mockUpdateFigure(
			figure.id,
			{ name: "f3b", updated_at: figure.updated_at },
			d,
		)
		expect(renamed.is_stale).toBe(false)

		const specChanged = await mockUpdateFigure(
			figure.id,
			{
				spec: { ...figure.spec, metric: "mean_mfi" },
				updated_at: renamed.updated_at,
			},
			d,
		)
		expect(specChanged.is_stale).toBe(true)

		await mockUpdateFigure(figure.id, { published: true }, d)
		await expect(mockUpdateFigure(figure.id, { name: "x" }, d)).rejects.toThrow(
			"publicada",
		)
	})

	it("optimistic lock — updated_at divergente falha", async () => {
		const d = deps([makeFile(1)])
		const figure = await mockCreateFigure(
			9,
			{
				name: "f4",
				chart_type: "stats_bar",
				spec: {
					groups: [{ name: "G", file_data_ids: [1] }],
					populations: [ROOT_POPULATION],
					metric: "percent_total",
				},
			},
			d,
		)
		await expect(
			mockUpdateFigure(
				figure.id,
				{ name: "x", updated_at: "2020-01-01T00:00:00Z" },
				d,
			),
		).rejects.toThrow()
	})

	it("lista, busca e remove no store", async () => {
		const d = deps([makeFile(1, [gate(11, "CD4", stats(1))])])
		await mockCreateFigure(
			9,
			{
				name: "a",
				chart_type: "stats_bar",
				spec: {
					groups: [{ name: "G", file_data_ids: [1] }],
					populations: ["CD4"],
					metric: "median_mfi",
					channel: "pe_a",
				},
			},
			d,
		)
		const list = await mockListFigures(9, d)
		expect(list).toHaveLength(1)
		expect(list[0].created_by_name).toBe("tester")

		mockDeleteFigure(list[0].id)
		expect(await mockListFigures(9, d)).toHaveLength(0)
		await expect(mockGetFigure(list[0].id, d)).rejects.toThrow("encontrada")
	})
})
