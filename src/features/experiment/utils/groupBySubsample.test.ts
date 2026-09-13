import { describe, expect, it } from "vitest"
import {
	groupFilesBySubsample,
	hasSubsampleLevel,
	SubsampleGroup,
} from "./groupBySubsample"
import { ExperimentFiles } from "../../../types"

const file = (
	id: number,
	subsample?: { id: number; name: string } | null,
): ExperimentFiles => ({
	id,
	file_name: `a${id}.fcs`,
	gates: [],
	active: true,
	deactivated_at: null,
	subsample,
})

describe("groupFilesBySubsample", () => {
	it("agrupa por subsample mantendo a ordem da API", () => {
		const groups = groupFilesBySubsample([
			file(1, { id: 10, name: "tempo_1" }),
			file(2, null),
			file(3, { id: 10, name: "tempo_1" }),
			file(4, { id: 20, name: "tempo_2" }),
		])
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
		expect(groups[0].subsample).toBeNull()
		expect(groups[0].files).toHaveLength(2)
	})

	it("retorna vazio para lista vazia", () => {
		expect(groupFilesBySubsample([])).toEqual([])
	})
})

describe("hasSubsampleLevel", () => {
	it("false quando nenhum arquivo tem subsample", () => {
		const groups: SubsampleGroup[] = [{ subsample: null, files: [file(1)] }]
		expect(hasSubsampleLevel(groups)).toBe(false)
	})

	it("true quando existe subsample real", () => {
		const groups = groupFilesBySubsample([
			file(1, { id: 10, name: "tempo_1" }),
			file(2),
		])
		expect(hasSubsampleLevel(groups)).toBe(true)
	})
})
