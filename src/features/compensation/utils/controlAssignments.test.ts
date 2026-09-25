import { describe, expect, it } from "vitest"
import {
	assignedFileIds,
	fileMatchesChannel,
	fluorescentChannels,
	sortFilesForRow,
	suggestControlAssignments,
	uncoveredChannels,
	validateControlAssignment,
} from "./controlAssignments"
import type { ExperimentFiles, Subsample } from "../../../types"

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

const subsample = (id: number, extra?: Partial<Subsample>): Subsample => ({
	id,
	name: `sub-${id}`,
	source_path: `sub-${id}`,
	active: true,
	created_at: "2026-01-01T00:00:00Z",
	files_count: 1,
	...extra,
})

const CHANNELS = [
	"FITC-A",
	"PE-A",
	"APC-A",
	"PE-Cy7-A",
	"FSC-A",
	"SSC-A",
	"Time",
]

describe("fluorescentChannels", () => {
	it("exclui FSC/SSC/Time e mantém os demais", () => {
		expect(fluorescentChannels(CHANNELS)).toEqual([
			"FITC-A",
			"PE-A",
			"APC-A",
			"PE-Cy7-A",
		])
	})
})

describe("fileMatchesChannel", () => {
	it("casa token do canal no nome do arquivo", () => {
		expect(fileMatchesChannel(file(1, "beads_APC_control.fcs"), "APC-A")).toBe(
			true,
		)
		expect(fileMatchesChannel(file(1, "beads_PECy7.fcs"), "PE-Cy7-A")).toBe(
			true,
		)
		expect(fileMatchesChannel(file(1, "Specimen_001_A1.fcs"), "APC-A")).toBe(
			false,
		)
	})
})

describe("sortFilesForRow", () => {
	it("match de nome primeiro, ordem natural no resto", () => {
		const files = [
			file(1, "a1.fcs"),
			file(2, "ctrl_APC.fcs"),
			file(3, "b2.fcs"),
		]
		const sorted = sortFilesForRow(files, (f) => fileMatchesChannel(f, "APC-A"))
		expect(sorted.map((f) => f.id)).toEqual([2, 1, 3])
	})
})

describe("suggestControlAssignments", () => {
	it("usa subsamples marcados como controle como prefill", () => {
		const files = [
			file(1, "neg.fcs", { subsample: 10 }),
			file(2, "apc.fcs", { subsample: 11 }),
			file(3, "amostra.fcs"),
		]
		const subs = [
			subsample(10, { control_type: "unstained" }),
			subsample(11, { control_type: "single_stain", control_channel: "APC-A" }),
		]
		const s = suggestControlAssignments(files, CHANNELS, subs)
		expect(s.negative).toEqual([1])
		expect(s.controls["APC-A"]).toEqual([2])
	})

	it("completa por nome os canais sem subsample marcado", () => {
		const files = [
			file(1, "unstained_ctrl.fcs"),
			file(2, "comp_FITC.fcs"),
			file(3, "comp_PECy7_beads.fcs"),
			file(4, "comp_APC.fcs"),
		]
		const s = suggestControlAssignments(files, CHANNELS, [])
		expect(s.negative).toEqual([1])
		// "APCCY7" é mais específico que "APC" — o token longo reclama o arquivo primeiro
		expect(s.controls["PE-Cy7-A"]).toEqual([3])
		expect(s.controls["APC-A"]).toEqual([4])
		expect(s.controls["FITC-A"]).toEqual([2])
	})

	it("nunca repete amostra entre linhas", () => {
		const files = [file(1, "unstained_APC.fcs"), file(2, "x.fcs")]
		const s = suggestControlAssignments(files, CHANNELS, [])
		expect(s.negative).toEqual([1])
		expect(s.controls["APC-A"]).toBeUndefined()
	})
})

describe("validateControlAssignment", () => {
	const ok = {
		negative: [1],
		controls: { "APC-A": [2], "PE-Cy7-A": [3] },
	}

	it("aceita atribuição completa", () => {
		expect(validateControlAssignment(ok)).toBeNull()
	})

	it("exige negativo", () => {
		expect(validateControlAssignment({ ...ok, negative: [] })).toMatch(
			/negativo/,
		)
	})

	it("exige ao menos 2 canais", () => {
		expect(
			validateControlAssignment({ negative: [1], controls: { "APC-A": [2] } }),
		).toMatch(/2 canais/)
	})

	it("rejeita amostra em dois papéis", () => {
		expect(
			validateControlAssignment({
				negative: [1],
				controls: { "APC-A": [1], "PE-Cy7-A": [2] },
			}),
		).toMatch(/dois papéis/)
	})
})

describe("uncoveredChannels", () => {
	it("lista canais sem controle", () => {
		expect(
			uncoveredChannels({ negative: [1], controls: { "APC-A": [2] } }, [
				"APC-A",
				"PE-A",
				"FITC-A",
			]),
		).toEqual(["PE-A", "FITC-A"])
	})
})

describe("assignedFileIds", () => {
	it("exclui os ids da própria linha", () => {
		const a = { negative: [1], controls: { "APC-A": [2], "PE-A": [3] } }
		expect(assignedFileIds(a)).toEqual(new Set([1, 2, 3]))
		expect(assignedFileIds(a, "APC-A")).toEqual(new Set([1, 3]))
		expect(assignedFileIds(a, "negative")).toEqual(new Set([2, 3]))
	})
})
