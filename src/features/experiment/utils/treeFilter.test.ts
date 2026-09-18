import { describe, expect, it } from "vitest"
import {
	fileMatchesQuery,
	filterFilesByQuery,
	filterGroupsByQuery,
	normalizeQuery,
} from "./treeFilter"
import { ExperimentFiles, SampleTag, Subsample } from "../../../types"
import { SubsampleGroup } from "./groupBySubsample"

const tag = (id: number, name: string): SampleTag => ({
	id,
	name,
	system_key: null,
	category: "general",
	color: "#10B981",
	scope: "personal",
	organization: null,
})

const file = (
	id: number,
	fileName: string,
	extra?: Partial<ExperimentFiles>,
): ExperimentFiles => ({
	id,
	file_name: fileName,
	gates: [],
	active: true,
	deactivated_at: null,
	...extra,
})

const subsample = (id: number, name: string): Subsample => ({
	id,
	name,
	source_path: name,
	active: true,
	created_at: "2026-09-13",
	files_count: 0,
})

describe("normalizeQuery", () => {
	it("remove acento e case", () => {
		expect(normalizeQuery("  Controle Água ")).toBe("controle agua")
	})
})

describe("fileMatchesQuery", () => {
	it("casa por file_name ignorando acento e case", () => {
		expect(fileMatchesQuery(file(1, "Sorovírus_D7.fcs"), "SOROVIRUS")).toBe(
			true,
		)
		expect(fileMatchesQuery(file(1, "a.fcs"), "xyz")).toBe(false)
	})

	it("casa por nome de tag explícita e herdada", () => {
		const f = file(1, "Specimen_001_A1.fcs", {
			tags: [tag(1, "FMO CD3")],
			inherited_tags: [tag(2, "Controle")],
		})
		expect(fileMatchesQuery(f, "fmo")).toBe(true)
		expect(fileMatchesQuery(f, "controle")).toBe(true)
		expect(fileMatchesQuery(f, "beads")).toBe(false)
	})

	it("query vazia casa tudo", () => {
		expect(fileMatchesQuery(file(1, "a.fcs"), "  ")).toBe(true)
	})
})

describe("filterGroupsByQuery", () => {
	const groups: SubsampleGroup[] = [
		{
			subsampleId: 10,
			subsample: subsample(10, "controles"),
			files: [file(1, "neg.fcs"), file(2, "fmo_cd3.fcs")],
		},
		{
			subsampleId: 20,
			subsample: subsample(20, "tratados"),
			files: [file(3, "d7.fcs"), file(4, "d14.fcs")],
		},
		{ subsampleId: null, subsample: null, files: [file(5, "solto.fcs")] },
	]

	it("nome do subsample mantém o grupo inteiro", () => {
		const result = filterGroupsByQuery(groups, "controles")
		expect(result).toHaveLength(1)
		expect(result[0].files.map((f) => f.id)).toEqual([1, 2])
	})

	it("nome de arquivo filtra dentro do grupo e esconde grupo sem match", () => {
		const result = filterGroupsByQuery(groups, "d7")
		expect(result).toHaveLength(1)
		expect(result[0].subsampleId).toBe(20)
		expect(result[0].files.map((f) => f.id)).toEqual([3])
	})

	it("tag da amostra mantém o grupo só com ela", () => {
		const withTag = file(6, "x.fcs", { tags: [tag(1, "Beads")] })
		const g: SubsampleGroup[] = [
			{ subsampleId: null, subsample: null, files: [withTag, file(7, "y")] },
		]
		const result = filterGroupsByQuery(g, "beads")
		expect(result[0].files.map((f) => f.id)).toEqual([6])
	})

	it("grupo 'Sem subsample' filtra normalmente e some sem match", () => {
		expect(
			filterGroupsByQuery(groups, "solto").map((g) => g.subsampleId),
		).toEqual([null])
		expect(filterGroupsByQuery(groups, "nada-aqui")).toHaveLength(0)
	})

	it("query vazia devolve os grupos intactos", () => {
		expect(filterGroupsByQuery(groups, "")).toBe(groups)
	})
})

describe("filterFilesByQuery", () => {
	it("filtra a lista plana", () => {
		const files = [file(1, "a.fcs"), file(2, "b.fcs")]
		expect(filterFilesByQuery(files, "a.fcs").map((f) => f.id)).toEqual([1])
		expect(filterFilesByQuery(files, "")).toBe(files)
	})
})
