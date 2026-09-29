import { describe, expect, it } from "vitest"
import type { ExperimentFiles, Subsample } from "../../../types"
import { availablePopulationPaths, groupsFromSubsamples } from "./figureGroups"

const file = (
	id: number,
	subsample: number | null = null,
	overrides: Partial<ExperimentFiles> = {},
): ExperimentFiles => ({
	id,
	file_name: `f${id}.fcs`,
	gates: [],
	active: true,
	deactivated_at: null,
	subsample,
	...overrides,
})

const subsample = (id: number, name: string): Subsample => ({
	id,
	name,
	source_path: name,
	active: true,
	created_at: "",
	files_count: 0,
})

describe("groupsFromSubsamples", () => {
	it("materializa subsamples como grupos e isola órfãs em 'Sem subsample'", () => {
		const files = [file(1, 10), file(2, 10), file(3, 20), file(4)]
		const groups = groupsFromSubsamples(files, [
			subsample(10, "D0"),
			subsample(20, "D7"),
		])
		expect(groups).toEqual([
			{ name: "D0", file_data_ids: [1, 2] },
			{ name: "D7", file_data_ids: [3] },
			{ name: "Sem subsample", file_data_ids: [4] },
		])
	})

	it("ignora amostras inativas e subsamples sem amostras", () => {
		const files = [file(1, 10), file(2, 10, { active: false })]
		const groups = groupsFromSubsamples(files, [
			subsample(10, "D0"),
			subsample(20, "D7"),
		])
		expect(groups).toEqual([{ name: "D0", file_data_ids: [1] }])
	})
})

describe("availablePopulationPaths", () => {
	const files: ExperimentFiles[] = [
		file(1, null, {
			gates: [
				{
					id: 100,
					name: "Linf",
					parent_id: null,
					gate_coordinates: {} as never,
					file_data: 1,
					dashboard: 0,
					children: [
						{
							id: 101,
							name: "CD4",
							parent_id: 100,
							gate_coordinates: {} as never,
							file_data: 1,
							dashboard: 0,
						},
					],
				},
			],
		}),
		file(2, null, {
			gates: [
				{
					id: 200,
					name: "CD8",
					parent_id: null,
					gate_coordinates: {} as never,
					file_data: 2,
					dashboard: 0,
				},
			],
		}),
	]

	it("união de caminhos 'Pai/Filho' das amostras indicadas", () => {
		expect(availablePopulationPaths(files, [1])).toEqual(["Linf", "Linf/CD4"])
		expect(availablePopulationPaths(files, [1, 2])).toEqual([
			"Linf",
			"Linf/CD4",
			"CD8",
		])
	})
})
