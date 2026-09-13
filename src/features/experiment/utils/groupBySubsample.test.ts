import { describe, expect, it } from "vitest"
import {
	groupFilesBySubsample,
	hasSubsampleLevel,
	SubsampleGroup,
} from "./groupBySubsample"
import { ExperimentFiles, Subsample } from "../../../types"

const file = (id: number, subsample?: number | null): ExperimentFiles => ({
	id,
	file_name: `a${id}.fcs`,
	gates: [],
	active: true,
	deactivated_at: null,
	subsample,
})

const subsample = (id: number, name: string): Subsample => ({
	id,
	name,
	source_path: name,
	active: true,
	created_at: "2026-09-13",
	files_count: 0,
})

describe("groupFilesBySubsample", () => {
	it("agrupa por subsample mantendo a ordem da API", () => {
		const subsamples = [subsample(10, "tempo_1"), subsample(20, "tempo_2")]
		const groups = groupFilesBySubsample(
			[file(1, 10), file(2, null), file(3, 10), file(4, 20)],
			subsamples,
		)
		expect(groups.map((g) => g.subsample?.name ?? null)).toEqual([
			"tempo_1",
			"tempo_2",
			null,
		])
		expect(groups[0].files.map((f) => f.id)).toEqual([1, 3])
		expect(groups[2].files.map((f) => f.id)).toEqual([2])
	})

	it("trata ausência do campo como Sem subsample", () => {
		const groups = groupFilesBySubsample([file(1), file(2, null)])
		expect(groups).toHaveLength(1)
		expect(groups[0].subsampleId).toBeNull()
		expect(groups[0].files).toHaveLength(2)
	})

	it("id desconhecido mantém grupo próprio sem fundir com Sem subsample", () => {
		const groups = groupFilesBySubsample([file(1, 99), file(2, null)])
		expect(groups).toHaveLength(2)
		expect(groups[0].subsampleId).toBe(99)
		expect(groups[0].subsample).toBeNull()
		expect(groups[1].subsampleId).toBeNull()
	})

	it("retorna vazio para lista vazia", () => {
		expect(groupFilesBySubsample([])).toEqual([])
	})
})

describe("hasSubsampleLevel", () => {
	it("false quando nenhum arquivo tem subsample", () => {
		const groups: SubsampleGroup[] = [
			{ subsampleId: null, subsample: null, files: [file(1)] },
		]
		expect(hasSubsampleLevel(groups)).toBe(false)
	})

	it("true quando existe subsample real, mesmo sem lista resolvida", () => {
		const groups = groupFilesBySubsample([file(1, 10), file(2)])
		expect(hasSubsampleLevel(groups)).toBe(true)
	})
})
